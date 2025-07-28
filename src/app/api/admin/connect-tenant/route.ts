import { createAdminHandler } from "@/lib/apiHandler";
import { isGlobalAdmin, createServerSupabaseClient } from "@/lib/auth";
import { connectTenantAsOwner } from "@/services/adminConnectTenant";
export { dynamic } from "@/lib/forceDynamic";

// POST /api/admin/connect-tenant - Connect as a tenant owner (global admin only)
export const POST = createAdminHandler(async ({ client, body }) => {
  if (!(await isGlobalAdmin())) throw new Error("Unauthorized");
  const { tenantId } = body;
  if (!tenantId) throw new Error("Tenant ID required");

  // Get current session for user identification
  const ssrClient = await createServerSupabaseClient();
  const {
    data: { session },
  } = await ssrClient.auth.getSession();
  if (!session) throw new Error("No active session");

  await connectTenantAsOwner(client, {
    tenantId,
    supabaseUserId: session.user.id,
    email: session.user.email,
    name: session.user.user_metadata?.name,
  });

  // We intentionally return minimal object; cookie is set in apiHandler via next/headers if needed externally.
  return { success: true };
});
