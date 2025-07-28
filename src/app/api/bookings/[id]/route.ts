import { createHandler } from "@/lib/apiHandler";
import { getBooking, updateBooking, deleteBooking } from "@/services/bookings";
import { ApiError } from "@/lib/apiHandler";

export const GET = createHandler(async ({ params, client }) => {
  const id = Number(params?.id);
  if (Number.isNaN(id))
    throw new ApiError("invalid_booking_id", "Invalid booking id");
  return await getBooking(client, id);
});

export const PUT = createHandler(async ({ params, client, body, tenantId }) => {
  const id = Number(params?.id);
  if (Number.isNaN(id))
    throw new ApiError("invalid_booking_id", "Invalid booking id");
  return await updateBooking(client, id, body, tenantId);
});

export const DELETE = createHandler(async ({ params, client }) => {
  const id = Number(params?.id);
  if (Number.isNaN(id))
    throw new ApiError("invalid_booking_id", "Invalid booking id");
  return await deleteBooking(client, id);
});
