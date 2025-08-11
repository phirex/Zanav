import { createAdminHandlerWithAuth } from "@/lib/apiHandler";

// POST /api/admin/direct-promote - Last resort direct SQL method to promote a user to global admin
export const POST = createAdminHandlerWithAuth(async ({ client, body }) => {
  const { userId, email, name } = body;
  return await promoteUserDirect(client, userId, email, name);
});
