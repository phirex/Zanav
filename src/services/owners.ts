import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function listOwners(
  client: SupabaseClient<Database>,
  tenantId?: string | null,
) {
  let query = client
    .from("Owner")
    .select(
      `*,
      dogs:Dog(*,
        bookings:Booking(*, payments:Payment(*), room:Room(*)),
        currentRoom:Room(*)
      ),
      bookings:Booking(*, payments:Payment(*), room:Room(*), dog:Dog(*))
    `,
    )
    .order("createdAt", { ascending: false });

  // Explicit tenant isolation (avoids relying on connection-level GUC)
  if (tenantId) {
    query = query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getOwner(client: SupabaseClient<Database>, id: number) {
  const { data, error } = await client
    .from("Owner")
    .select(
      `*,
      dogs:Dog(*,
        currentRoom:Room(*),
        bookings:Booking(*, room:Room(*), payments:Payment(*))
      ),
      bookings:Booking(*, dog:Dog(*), room:Room(*), payments:Payment(*))
    `,
    )
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);

  // sort bookings by startDate desc
  if (data?.bookings) {
    data.bookings.sort(
      (a: any, b: any) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );
  }
  if (data?.dogs) {
    data.dogs.forEach((dog: any) => {
      if (dog.bookings) {
        dog.bookings.sort(
          (a: any, b: any) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        );
      }
    });
  }

  return data;
}

export async function createOwner(
  client: SupabaseClient<Database>,
  tenantId: string | null,
  body: any,
) {
  if (!tenantId) {
    throw new Error("Tenant ID is required for owner creation");
  }

  const { name, email, phone, address, dogs } = body;
  if (!name || !phone) throw new Error("Missing owner name or phone");

  const { data: ownerRow, error: ownerErr } = await client
    .from("Owner")
    .insert({ name, email, phone, address, tenantId })
    .select("id")
    .single();
  if (ownerErr) throw new Error(ownerErr.message);

  if (dogs && Array.isArray(dogs) && dogs.length) {
    const dogRows = dogs.map((d: any) => ({
      name: d.name,
      breed: d.breed,
      specialNeeds: d.specialNeeds ?? null,
      ownerId: ownerRow.id,
      tenantId,
    }));
    const { error: dogErr } = await client.from("Dog").insert(dogRows);
    if (dogErr) throw new Error(dogErr.message);
  }

  return await getOwner(client, ownerRow.id);
}

export async function updateOwner(
  client: SupabaseClient<Database>,
  tenantId: string | null,
  body: any,
) {
  if (!tenantId) {
    throw new Error("Tenant ID is required for owner update");
  }

  const { id, name, email, phone, address, dogs } = body;
  if (!id) throw new Error("Owner id is required");

  const { error: updErr } = await client
    .from("Owner")
    .update({ name, email, phone, address })
    .eq("id", id);
  if (updErr) throw new Error(updErr.message);

  if (dogs && Array.isArray(dogs)) {
    for (const dog of dogs) {
      if (dog.id) {
        const { error } = await client
          .from("Dog")
          .update({
            name: dog.name,
            breed: dog.breed,
            specialNeeds: dog.specialNeeds ?? null,
          })
          .eq("id", dog.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await client.from("Dog").insert({
          name: dog.name,
          breed: dog.breed,
          specialNeeds: dog.specialNeeds ?? null,
          ownerId: id,
          tenantId,
        });
        if (error) throw new Error(error.message);
      }
    }
  }

  return await getOwner(client, id);
}

export async function deleteOwner(
  client: SupabaseClient<Database>,
  ownerId: number,
) {
  // fetch bookings to cascade delete payments & notifications
  const { data: bookings, error: bookErr } = await client
    .from("Booking")
    .select("id")
    .eq("ownerId", ownerId);
  if (bookErr) throw new Error(bookErr.message);

  for (const booking of bookings ?? []) {
    await client
      .from("ScheduledNotification")
      .delete()
      .eq("bookingId", booking.id);
    await client.from("Payment").delete().eq("bookingId", booking.id);
  }

  await client.from("Booking").delete().eq("ownerId", ownerId);
  await client.from("Dog").delete().eq("ownerId", ownerId);
  const { error: delErr } = await client
    .from("Owner")
    .delete()
    .eq("id", ownerId);
  if (delErr) throw new Error(delErr.message);
  return { success: true };
}
