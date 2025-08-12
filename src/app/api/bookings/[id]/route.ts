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
  return data;
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
