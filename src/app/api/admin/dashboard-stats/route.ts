import { createAdminHandlerWithAuth } from "@/lib/apiHandler";

export const GET = createAdminHandlerWithAuth(async ({ client }) => {
  // Get basic stats
  const { count: totalTenants } = await client
    .from("Tenant")
    .select("*", { count: "exact", head: true });

  const { count: totalUsers } = await client
    .from("User")
    .select("*", { count: "exact", head: true });

  return {
    totalTenants: totalTenants || 0,
    totalUsers: totalUsers || 0,
  };
}); 