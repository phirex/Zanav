import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

interface BookingQueryOptions {
  month?: string | null;
  year?: string | null;
  includeDeleted?: boolean;
}

export const PAYMENT_METHODS = [
  "CASH",
  "CREDIT_CARD",
  "BANK_TRANSFER",
  "BIT",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PRICE_TYPES = ["DAILY", "FIXED"] as const;
export type PriceType = (typeof PRICE_TYPES)[number];
export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export async function listBookings(
  client: SupabaseClient<Database>,
  tenantId: string,
  options: BookingQueryOptions = {},
) {
  const { month, year, includeDeleted = false } = options;
  console.log(`[listBookings] Called with tenantId: ${tenantId}`);
  console.log(`[listBookings] Options:`, options);

  // Check current authenticated user
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession();
  if (session?.user) {
    console.log(
      `[listBookings] Current user: ${session.user.email} (ID: ${session.user.id})`,
    );
  } else {
    console.log(
      `[listBookings] Current user: none`,
      sessionError
        ? `Auth session error: ${sessionError.message}`
        : "Auth session missing!",
    );
  }

  // Test: Try a simple count query first to see if RLS is the issue
  try {
    const { count, error: countError } = await client
      .from("Booking")
      .select("*", { count: "exact", head: true })
      .eq("tenantId", tenantId);

    console.log("[listBookings] Direct count query result:", {
      count,
      error: countError?.message,
    });
  } catch (e) {
    console.error("[listBookings] Count query failed:", e);
  }

  let query = client
    .from("Booking")
    .select(
      `
      id,
      roomId,
      ownerId,
      startDate,
      endDate,
      status,
      priceType,
      pricePerDay,
      totalPrice,
      exemptLastDay,
      createdAt,
      updatedAt,

      room:Room(id, name, displayName, capacity),
      dog:Dog(id, name, breed,
        owner:Owner(id, name, phone)
      ),
      payments:Payment(amount, createdAt)
    `,
    )
    // Added explicit tenant isolation now that we removed the connection-level GUC
    .eq("tenantId", tenantId)
    .order("startDate", { ascending: false });

  // Apply month/year filtering if provided
  if (month && year) {
    console.log("[listBookings] Applying month/year filter:", { month, year });
    const numMonth = parseInt(month);
    const numYear = parseInt(year);

    // Create date range for the specific month
    const monthStart = new Date(numYear, numMonth - 1, 1);
    const monthEnd = new Date(numYear, numMonth, 0, 23, 59, 59, 999);

    // Include bookings that overlap the month window:
    // startDate <= monthEnd AND endDate >= monthStart
    query = query
      .lte("startDate", monthEnd.toISOString())
      .gte("endDate", monthStart.toISOString());
  }

  // No explicit tenant filter – RLS via set_tenant limits rows automatically

  const { data, error } = await query;

  console.log("[listBookings] Query result:", {
    error: error?.message || null,
    dataLength: data?.length || 0,
  });

  if (error) {
    console.error("[listBookings] Database error:", error);
    throw new Error(error.message);
  }

  // Split upcoming vs past bookings
  const now = new Date();
  const upcoming = (data || []).filter((b) => new Date(b.startDate) >= now);
  const past = (data || []).filter((b) => new Date(b.startDate) < now);

  const result = { upcoming, past, all: data || [] };
  console.log("[listBookings] Final result:", {
    all: result.all.length,
    upcoming: result.upcoming.length,
    past: result.past.length,
  });

  return result;
}

export async function createBooking(
  client: SupabaseClient<Database>,
  tenantId: string | null,
  data: any,
) {
  if (!tenantId) {
    throw new Error("Tenant ID is required for booking creation");
  }

  // tenantId is now guaranteed to be string
  const safeTenantId = tenantId;

  // Validate basic fields
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  if (endDate < startDate) {
    throw new Error("End date must be after start date");
  }

  const bookingFields = {
    startDate,
    endDate,
    priceType: (data.priceType || "DAILY").toUpperCase(),
    pricePerDay: parseFloat(data.pricePerDay) || null,
    totalPrice: parseFloat(data.totalPrice) || null,
    paymentMethod: data.paymentMethod,
    isNewClient: data.isNewClient,
  } as const;

  // ---------------- Owner ----------------
  let ownerId: number = data.ownerId;
  if (bookingFields.isNewClient) {
    const ownerName =
      data.ownerName || `${data.firstName} ${data.lastName}`.trim();
    const ownerData: any = {
      name: ownerName,
      email: data.ownerEmail || null,
      phone: data.ownerPhone,
      address: data.ownerAddress || null,
    };
    ownerData.tenantId = safeTenantId;

    const { data: ownerRow, error: ownerErr } = await client
      .from("Owner")
      .insert(ownerData)
      .select("id")
      .single();
    if (ownerErr)
      throw new Error(`Failed to create owner: ${ownerErr.message}`);
    ownerId = ownerRow!.id;
  }

  // ---------------- Dogs ----------------
  let dogsWithRooms: Array<{ id: number; roomId: number }> = [];
  if (bookingFields.isNewClient) {
    const dogRows = data.newDogs.map((dog: any) => ({
      name: dog.name,
      breed: dog.breed,
      specialNeeds: dog.specialNeeds ?? "",
      ownerId,
      tenantId: safeTenantId,
    }));
    const { data: insertedDogs, error: dogErr } = await client
      .from("Dog")
      .insert(dogRows)
      .select("id");
    if (dogErr) throw new Error("Failed to create dogs");
    dogsWithRooms = insertedDogs!.map((d: { id: number }, idx: number) => ({
      id: d.id,
      roomId: data.newDogs[idx].roomId,
    }));
  } else {
    dogsWithRooms = data.dogs;
  }

  // ---------------- Price ----------------
  let totalPrice = bookingFields.totalPrice;
  if (
    !totalPrice &&
    bookingFields.priceType === "DAILY" &&
    bookingFields.pricePerDay
  ) {
    const days = Math.ceil(
      (bookingFields.endDate.getTime() - bookingFields.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    totalPrice = bookingFields.pricePerDay * days * dogsWithRooms.length;
  }
  const pricePerDog = totalPrice ? totalPrice / dogsWithRooms.length : null;

  // ---------------- Bookings ----------------
  // Validate and cast enum fields
  const paymentMethod = PAYMENT_METHODS.includes(data.paymentMethod)
    ? (data.paymentMethod as PaymentMethod)
    : "CASH";
  const priceType = PRICE_TYPES.includes(data.priceType || "DAILY")
    ? ((data.priceType || "DAILY") as PriceType)
    : "DAILY";
  const status = BOOKING_STATUSES.includes(data.status || "CONFIRMED")
    ? ((data.status || "CONFIRMED") as BookingStatus)
    : "CONFIRMED";
  const bookingRows = dogsWithRooms.map(({ id: dogId, roomId }) => ({
    dogId,
    roomId,
    ownerId,
    startDate: bookingFields.startDate.toISOString(),
    endDate: bookingFields.endDate.toISOString(),
    priceType,
    pricePerDay: bookingFields.pricePerDay,
    totalPrice: pricePerDog,
    paymentMethod,
    status,
    tenantId: safeTenantId,
  }));

  const { data: createdBookings, error: bookErr } = await client
    .from("Booking")
    .insert(bookingRows)
    .select("*");
  if (bookErr) throw new Error("Failed to create booking");

  // ---------------- Update dog current room ----------------
  for (const { id: dogId, roomId } of dogsWithRooms) {
    await client.from("Dog").update({ currentRoomId: roomId }).eq("id", dogId);
  }

  // ---------------- Notifications & WhatsApp + Emails ----------------
  try {
    const { NotificationScheduler } = await import(
      "@/lib/services/notification-scheduler"
    );
    const { sendEmail } = await import("@/lib/email/resend");
    const { bookingConfirmedCustomerEmail } = await import(
      "@/lib/email/templates"
    );
    const scheduler = new NotificationScheduler(safeTenantId);
    for (const b of createdBookings ?? []) {
      await scheduler.scheduleBookingNotifications(b.id);
    }

    if (createdBookings && createdBookings.length > 0) {
      await sendBookingConfirmation(client, createdBookings[0].id);

      // Send confirmation email if owner has email and booking is confirmed
      const first = createdBookings[0];
      const { data: ownerRow } = await client
        .from("Owner")
        .select("name,email")
        .eq("id", first.ownerId)
        .single();
      if (ownerRow?.email) {
        // Fetch settings for kennel name & currency
        const { data: settingsRows } = await client
          .from("Setting")
          .select("key,value")
          .eq("tenantId", safeTenantId);
        const settings = new Map(
          (settingsRows || []).map((r: any) => [r.key, r.value]),
        );
        const kennelName =
          settings.get("kennelName") ||
          settings.get("businessName") ||
          "Your Kennel";

        const { data: dogNames } = await client
          .from("Dog")
          .select("name")
          .in(
            "id",
            createdBookings.map((b: any) => b.dogId),
          );

        const startDateStr = new Date(first.startDate).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          },
        );
        const endDateStr = new Date(first.endDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        const html = bookingConfirmedCustomerEmail({
          kennelName,
          customerName: ownerRow.name,
          dogs: (dogNames || []).map((d: any) => d.name),
          startDate: startDateStr,
          endDate: endDateStr,
        });
        await sendEmail({
          to: ownerRow.email,
          subject: "Your booking is confirmed",
          html,
        });
      }
    }
  } catch (e) {
    console.error("Post-booking side effects failed", e);
  }

  return createdBookings;
}

export async function deleteBooking(
  client: SupabaseClient<Database>,
  bookingId: number,
) {
  // Fetch booking with relations before delete
  const { data: booking, error: fetchErr } = await client
    .from("Booking")
    .select(`*, dog:Dog(*, owner:Owner(*)), room:Room(*), payments:Payment(*)`)
    .eq("id", bookingId)
    .single();
  if (fetchErr) throw new Error("Failed to fetch booking before delete");

  // Delete related notifications & payments then booking
  await client
    .from("ScheduledNotification")
    .delete()
    .eq("bookingId", bookingId);
  await client.from("Payment").delete().eq("bookingId", bookingId);
  const { error: delErr } = await client
    .from("Booking")
    .delete()
    .eq("id", bookingId);
  if (delErr) throw new Error("Failed to delete booking");

  return booking;
}

// Helper ------------------------------
function formatPhoneNumber(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.startsWith("0")) return "+972" + digitsOnly.substring(1);
  if (digitsOnly.startsWith("972")) return "+" + digitsOnly;
  return "+972" + digitsOnly;
}

async function sendBookingConfirmation(
  client: SupabaseClient<Database>,
  bookingId: number,
) {
  const { format } = await import("date-fns");
  const { WhatsAppService } = await import("@/lib/services/whatsapp");

  const { data: booking } = await client
    .from("Booking")
    .select("*, dog:Dog(*), owner:Owner(*)")
    .eq("id", bookingId)
    .single();
  if (!booking) return;

  const startDate = format(new Date(booking.startDate), "dd/MM/yyyy");
  const endDate = format(new Date(booking.endDate), "dd/MM/yyyy");
  const phoneNumber = formatPhoneNumber(booking.owner.phone);

  const whatsappService = new WhatsAppService();
  const variables = {
    firstName: booking.owner.name.split(" ")[0],
    petName: booking.dog.name,
    checkInDate: startDate,
    checkOutDate: endDate,
    bookingId: bookingId.toString(),
  };
  await whatsappService.sendMessage({
    to: phoneNumber,
    template: "BOOKING_CONFIRMATION",
    variables,
  });
}

export async function getBooking(client: SupabaseClient<Database>, id: number) {
  const { data, error } = await client
    .from("Booking")
    .select(`*,dog:Dog(*, owner:Owner(*)),room:Room(*),payments:Payment(*)`)
    .eq("id", id)
    .order("createdAt", {
      ascending: false,
      foreignTable: "Payment",
    })
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateBooking(
  client: SupabaseClient<Database>,
  id: number,
  body: any,
  tenantId?: string | null,
) {
  // Fetch current booking status to detect changes
  const { data: currentBooking } = await client
    .from("Booking")
    .select("status")
    .eq("id", id)
    .single();

  // Price calculation (only if price fields provided)
  let totalPrice = body.totalPrice;
  if (
    body.priceType === "DAILY" &&
    body.pricePerDay &&
    body.startDate &&
    body.endDate
  ) {
    const days = Math.ceil(
      (new Date(body.endDate).getTime() - new Date(body.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    totalPrice = body.pricePerDay * days;
  }

  // Whitelist only updatable columns; allow partial updates
  const updateData: any = {};
  if ("roomId" in body) updateData.roomId = body.roomId;
  if ("status" in body) updateData.status = body.status;
  if ("priceType" in body) updateData.priceType = body.priceType;
  if ("pricePerDay" in body) updateData.pricePerDay = body.pricePerDay;
  if ("exemptLastDay" in body) updateData.exemptLastDay = !!body.exemptLastDay;
  if ("startDate" in body && body.startDate)
    updateData.startDate = new Date(body.startDate).toISOString();
  if ("endDate" in body && body.endDate)
    updateData.endDate = new Date(body.endDate).toISOString();
  if (typeof totalPrice === "number" && !Number.isNaN(totalPrice))
    updateData.totalPrice = totalPrice;

  const { data: updated, error } = await client
    .from("Booking")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  // Side effects if status became CONFIRMED
  const statusChanged = currentBooking && currentBooking.status !== body.status;
  const becameConfirmed = statusChanged && body.status === "CONFIRMED";
  const becameCancelled = statusChanged && body.status === "CANCELLED";
  if (becameConfirmed) {
    try {
      const { NotificationScheduler } = await import(
        "@/lib/services/notification-scheduler"
      );
      const { sendEmail } = await import("@/lib/email/resend");
      const { bookingConfirmedCustomerEmail } = await import(
        "@/lib/email/templates"
      );
      const scheduler = new NotificationScheduler(tenantId || null);
      await scheduler.scheduleNotificationsForBooking(
        id,
        "BOOKING_CONFIRMATION",
      );
      await scheduler.scheduleNotificationsForBooking(id, "CHECK_IN_REMINDER");
      await scheduler.scheduleNotificationsForBooking(id, "CHECK_OUT_REMINDER");
      await sendBookingConfirmation(client, id);

      // Email notify customer
      const { data: bookingRow } = await client
        .from("Booking")
        .select("*, owner:Owner(*), dog:Dog(*)")
        .eq("id", id)
        .single();
      if (bookingRow?.owner?.email) {
        const { data: settingsRows } = await client
          .from("Setting")
          .select("key,value")
          .eq("tenantId", bookingRow.tenantId);
        const settings = new Map(
          (settingsRows || []).map((r: any) => [r.key, r.value]),
        );
        const kennelName =
          settings.get("kennelName") ||
          settings.get("businessName") ||
          "Your Kennel";
        const html = bookingConfirmedCustomerEmail({
          kennelName,
          customerName: bookingRow.owner.name,
          dogs: [bookingRow.dog?.name].filter(Boolean) as string[],
          startDate: new Date(bookingRow.startDate).toLocaleDateString(
            "en-US",
            { year: "numeric", month: "short", day: "numeric" },
          ),
          endDate: new Date(bookingRow.endDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          note: typeof body.note === "string" ? body.note : undefined,
        });
        await sendEmail({
          to: bookingRow.owner.email,
          subject: "Your booking is confirmed",
          html,
        });
      }
    } catch (e) {
      console.error("updateBooking side-effects failed", e);
    }
  }

  if (becameCancelled) {
    try {
      const { sendEmail } = await import("@/lib/email/resend");
      const { bookingCancelledCustomerEmail } = await import(
        "@/lib/email/templates"
      );
      const { data: bookingRow } = await client
        .from("Booking")
        .select("*, owner:Owner(*), dog:Dog(*), tenantId")
        .eq("id", id)
        .single();
      if (bookingRow?.owner?.email) {
        const { data: settingsRows } = await client
          .from("Setting")
          .select("key,value")
          .eq("tenantId", bookingRow.tenantId);
        const settings = new Map(
          (settingsRows || []).map((r: any) => [r.key, r.value]),
        );
        const kennelName =
          settings.get("kennelName") ||
          settings.get("businessName") ||
          "Your Kennel";
        const html = bookingCancelledCustomerEmail({
          kennelName,
          customerName: bookingRow.owner.name,
          startDate: new Date(bookingRow.startDate).toLocaleDateString(
            "en-US",
            { year: "numeric", month: "short", day: "numeric" },
          ),
          endDate: new Date(bookingRow.endDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          reason: typeof body.note === "string" ? body.note : undefined,
        });
        await sendEmail({
          to: bookingRow.owner.email,
          subject: "Your booking was cancelled",
          html,
        });
      }
    } catch (e) {
      console.error("updateBooking cancellation email failed", e);
    }
  }

  return updated;
}

export async function listUnpaidBookings(
  client: SupabaseClient<Database>,
  tenantId?: string | null,
): Promise<any[]> {
  const todayISO = new Date().toISOString();
  let query = client
    .from("Booking")
    .select(`*,dog:Dog(*, owner:Owner(*)),room:Room(*),payments:Payment(*)`)
    .lt("endDate", todayISO)
    .order("endDate", { ascending: false });

  if (tenantId) {
    query = query.eq("tenantId", tenantId);
  }

  const { data: pastBookings, error } = await query;
  if (error) throw new Error(error.message);
  if (!pastBookings) return [];

  const unpaid = pastBookings.filter((booking) => {
    // number of days inclusive of start & end
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const days =
      Math.round(
        (new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime() -
          new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate(),
          ).getTime()) /
          (1000 * 60 * 60 * 24),
      ) +
      1 -
      (booking.exemptLastDay ? 1 : 0);

    let total = 0;
    if (booking.priceType === "FIXED") {
      total = booking.totalPrice || 0;
    } else if (booking.priceType === "DAILY" && booking.pricePerDay) {
      total = booking.pricePerDay * days;
    }

    const paid = (booking.payments || []).reduce(
      (sum: number, p: any) => sum + (p.amount || 0),
      0,
    );

    const remaining = Number((total - paid).toFixed(2));
    return remaining > 10; // buffer for rounding
  });

  return unpaid;
}

export async function resetExemptLastDayPrices(
  client: SupabaseClient<Database>,
): Promise<{ updatedCount: number; updatedPriceCount: number }> {
  // set exemptLastDay false for all bookings, capture count
  const { error: updateError, count } = await client
    .from("Booking")
    .update({ exemptLastDay: false })
    .select("count");
  if (updateError) throw new Error(updateError.message);

  // fetch daily bookings with pricePerDay
  const { data: dailyBookings, error: fetchErr } = await client
    .from("Booking")
    .select("*")
    .eq("priceType", "DAILY")
    .not("pricePerDay", "is", null);
  if (fetchErr) throw new Error(fetchErr.message);

  let updatedPriceCount = 0;
  for (const booking of dailyBookings ?? []) {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const days =
      Math.round(
        (new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime() -
          new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate(),
          ).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1; // inclusive
    const newTotal = (booking.pricePerDay || 0) * days;
    if (booking.totalPrice !== newTotal) {
      const { error: updErr } = await client
        .from("Booking")
        .update({ totalPrice: newTotal })
        .eq("id", booking.id);
      if (!updErr) updatedPriceCount++;
    }
  }
  return { updatedCount: count || 0, updatedPriceCount };
}
