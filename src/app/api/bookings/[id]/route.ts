import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";
import { updateBooking, deleteBooking } from "@/services/bookings";
import { ApiError } from "@/lib/apiHandler";

function extractId(params?: Record<string, any>): number {
  const candidate = (params?.id ?? params?.params?.id) as string | undefined;
  const id = Number(candidate);
  return id;
}

export const GET = createHandler(async ({ params, tenantId }) => {
  const id = extractId(params);
  if (Number.isNaN(id)) throw new ApiError("invalid_booking_id", "Invalid booking id");
  if (!tenantId) throw new ApiError("missing_tenant", "No tenant context");

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("Booking")
    .select(`*,dog:Dog(*, owner:Owner(*)),room:Room(*),payments:Payment(*)`)
    .eq("id", id)
    .eq("tenantId", tenantId)
    .single();
  if (error || !data) throw new ApiError("not_found", "Booking not found");
  // Fetch sibling bookings that belong to the same owner & date range (multi-dog group)
  const { data: siblings } = await admin
    .from("Booking")
    .select(`id,dog:Dog(id,name),ownerId,startDate,endDate,status`)
    .eq("ownerId", data.ownerId)
    .eq("tenantId", tenantId)
    .eq("startDate", data.startDate)
    .eq("endDate", data.endDate);

  const group = Array.isArray(siblings)
    ? {
        count: siblings.length,
        ids: siblings.map((b) => b.id),
        dogs: siblings.map((b) => b.dog?.name).filter(Boolean),
        anyPending: siblings.some((b) => b.status === "PENDING"),
      }
    : { count: 1, ids: [data.id], dogs: [data.dog?.name].filter(Boolean), anyPending: data.status === "PENDING" };

  return { ...data, group };
});

export const PUT = createHandler(async ({ params, client, body, tenantId }) => {
  const id = extractId(params);
  if (Number.isNaN(id)) throw new ApiError("invalid_booking_id", "Invalid booking id");
  return await updateBooking(client, id, body, tenantId);
});

export const DELETE = createHandler(async ({ params, client }) => {
  const id = extractId(params);
  if (Number.isNaN(id)) throw new ApiError("invalid_booking_id", "Invalid booking id");
  return await deleteBooking(client, id);
});
