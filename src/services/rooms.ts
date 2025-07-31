import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

export async function listRooms(
  client: SupabaseClient<Database>,
  tenantId?: string | null,
) {
  let query = client.from("Room").select("*").order("id", { ascending: true });

  // Explicit tenant isolation (we no longer rely on connection-level GUC)
  if (tenantId) {
    query = query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function createRoom(
  client: SupabaseClient<Database>,
  tenantId: string | null,
  body: any,
) {
  if (!tenantId) {
    throw new Error("Tenant ID is required for room creation");
  }

  const { name, displayName, maxCapacity } = body;
  if (!name || !displayName || maxCapacity === undefined) {
    throw new Error("Missing required fields: name, displayName, maxCapacity");
  }
  const { data, error } = await client
    .from("Room")
    .insert({ name, displayName, maxCapacity, capacity: 0, tenantId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getRoom(client: SupabaseClient<Database>, id: number) {
  const { data, error } = await client
    .from("Room")
    .select(`*,bookings:Booking(*, dog:Dog(*), owner:Owner(*))`)
    .eq("id", id)
    .gte("bookings.endDate", new Date().toISOString())
    .order("bookings.startDate", { ascending: true })
    .limit(1, { foreignTable: "bookings" })
    .single();
  if (error) {
    if (error.code === "PGRST116") throw new Error("Room not found");
    throw new Error(error.message);
  }
  return data;
}
