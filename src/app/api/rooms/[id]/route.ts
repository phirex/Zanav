import { createHandler } from "@/lib/apiHandler";
import { getRoom } from "@/services/rooms";
import { ApiError } from "@/lib/apiHandler";

export const GET = createHandler(async ({ params, client }) => {
  const id = Number(params?.id);
  if (Number.isNaN(id))
    throw new ApiError("invalid_room_id", "Invalid room id");
  return await getRoom(client, id);
});
