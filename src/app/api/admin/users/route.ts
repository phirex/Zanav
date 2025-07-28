import { createAdminHandler } from "@/lib/apiHandler";
import { listAuthUsers } from "@/services/adminUsers";
import { isGlobalAdmin } from "@/lib/auth";

// GET /api/admin/users - Get all users (global admin only)
export const GET = createAdminHandler(async ({ client }) => {
  if (!(await isGlobalAdmin())) throw new Error("Unauthorized");
  return await listAuthUsers(client);
});
