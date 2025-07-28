import { createAdminHandler } from "@/lib/apiHandler";
import {
  listTenantsWithOwner,
  createTenantAdmin,
} from "@/services/adminTenants";
import { isGlobalAdmin } from "@/lib/auth";

// GET /api/admin/tenants - Get all tenants (global admin only)
export const GET = createAdminHandler(async ({ client }) => {
  if (!(await isGlobalAdmin())) throw new Error("Unauthorized");
  return await listTenantsWithOwner(client);
});

// POST /api/admin/tenants - Create a new tenant (global admin only)
export const POST = createAdminHandler(async ({ client, body }) => {
  if (!(await isGlobalAdmin())) throw new Error("Unauthorized");
  const { name } = body;
  return await createTenantAdmin(client, name);
});
