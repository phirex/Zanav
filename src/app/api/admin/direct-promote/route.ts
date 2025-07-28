import { createAdminHandler } from "@/lib/apiHandler";
import { isGlobalAdmin } from "@/lib/auth";
import { promoteUserDirect } from "@/services/adminDirectPromote";

// POST /api/admin/direct-promote - Last resort direct SQL method to promote a user to global admin
export const POST = createAdminHandler(async ({ client, body }) => {
  if (!(await isGlobalAdmin())) throw new Error("Unauthorized");
  const { userId, email, name } = body;
  return await promoteUserDirect(client, userId, email, name);
});
