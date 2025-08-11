import { createAdminHandlerWithAuth } from "@/lib/apiHandler";
import { isGlobalAdmin, createServerSupabaseClient } from "@/lib/auth";
import { cookies } from "next/headers";
import { connectTenantAdmin } from "@/services/adminTenants";

export { dynamic } from "@/lib/forceDynamic";

// POST /api/admin/tenants/[tenantId]/connect - Connect as a tenant (global admin only)
export const POST = createAdminHandlerWithAuth(async ({ client, params }) => {
  if (!(await isGlobalAdmin())) throw new Error("Unauthorized");

  const tenantId =
    params?.tenantId || params?.id || (params as any)?.["tenantId"];
  if (!tenantId) throw new Error("Tenant ID required");

  // get current session via SSR client
  const ssrClient = await createServerSupabaseClient();
  const {
    data: { session },
  } = await ssrClient.auth.getSession();
  if (!session) throw new Error("No active session");

  const { tenant } = await connectTenantAdmin(client, {
    tenantId,
    session,
  } as any);

  // Set cookie for UI context
  cookies().set("admin-tenant-id", tenantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return { message: `Connected to tenant: ${tenant.name}`, tenant };
});
