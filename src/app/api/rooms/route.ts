import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";
import { listRooms, createRoom } from "@/services/rooms";

export const GET = createHandler(async ({ tenantId }) => {
  const adminClient = supabaseAdmin();
  return await listRooms(adminClient, tenantId);
});

export const POST = createHandler(async ({ client, tenantId, body }) => {
  const room = await createRoom(client, tenantId, body);
  return room;
});
