import { createAdminHandlerWithAuth } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createAdminHandlerWithAuth(async ({ client }) => {
  // Get all tenants with basic info
  const { data: tenants, error: tenantError } = await client
    .from("Tenant")
    .select("id, name, createdAt, subdomain")
    .order("createdAt", { ascending: false });

  if (tenantError) {
    console.error("Error fetching tenants:", tenantError);
    return { error: "Failed to fetch tenants" };
  }

  // Get user-tenant relationships to show owner info
  const { data: userTenants, error: userTenantError } = await client
    .from("UserTenant")
    .select(`
      user_id,
      tenant_id,
      role,
      User!inner(
        id,
        email,
        name
      )
    `)
    .eq("role", "OWNER");

  if (userTenantError) {
    console.error("Error fetching user-tenant relationships:", userTenantError);
    // Continue without owner info rather than failing completely
  }

  // Map tenants with owner information
  const tenantsWithOwners = (tenants || []).map(tenant => {
    const ownerLink = userTenants?.find(ut => ut.tenant_id === tenant.id);
    return {
      id: tenant.id,
      name: tenant.name,
      createdAt: tenant.createdAt,
      subdomain: tenant.subdomain,
      ownerEmail: ownerLink?.User?.email || null,
      ownerName: ownerLink?.User?.name || null,
      role: ownerLink?.role || null
    };
  });

  return { tenants: tenantsWithOwners };
});

export const POST = createAdminHandlerWithAuth(async ({ client, body }) => {
  const { name, subdomain } = body;

  if (!name) {
    return { error: "Tenant name is required" };
  }

  const { data: tenant, error } = await client
    .from("Tenant")
    .insert([
      {
        name,
        subdomain: subdomain || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating tenant:", error);
    return { error: "Failed to create tenant" };
  }

  return { tenant };
});
