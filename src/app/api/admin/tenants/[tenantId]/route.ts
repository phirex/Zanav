import { createAdminHandler } from "@/lib/apiHandler";
import { isGlobalAdmin } from "@/lib/auth";
import { deleteTenant } from "@/services/adminTenants";

// DELETE /api/admin/tenants/[id] - Delete a tenant (global admin only)
export const DELETE = createAdminHandler(async ({ client, params }) => {
  if (!(await isGlobalAdmin())) throw new Error("Unauthorized");
  const tenantId =
    params?.tenantId ||
    params?.id ||
    params?.tenantid ||
    params?.tid ||
    (params as any)?.["tenantId"];
  return await deleteTenant(client, tenantId as string);
});
