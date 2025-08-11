import { createAdminHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

// GET /api/admin/tenants - Get all tenants (global admin only)
export const GET = createAdminHandler(async () => {
  try {
    const adminSupabase = supabaseAdmin();

    // Get all tenants with basic info
    const { data: tenants, error: tenantError } = await adminSupabase
      .from("Tenant")
      .select("id, name, createdAt, subdomain")
      .order("createdAt", { ascending: false });

    if (tenantError) {
      console.error("Error fetching tenants:", tenantError);
      throw new Error("Failed to fetch tenants");
    }

    // Get user-tenant relationships to show owner info
    const { data: userTenants, error: userTenantError } = await adminSupabase
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

  } catch (error) {
    console.error("Error in tenants API:", error);
    return { tenants: [], error: error instanceof Error ? error.message : "Unknown error" };
  }
});

// POST /api/admin/tenants - Create a new tenant (global admin only)
export const POST = createAdminHandler(async (ctx) => {
  try {
    const { name } = ctx.body || {};
    
    if (!name || !name.trim()) {
      return { error: "Tenant name is required" };
    }

    const adminSupabase = supabaseAdmin();

    // Check if tenant already exists
    const { data: existing } = await adminSupabase
      .from("Tenant")
      .select("id")
      .eq("name", name.trim())
      .maybeSingle();

    if (existing) {
      return { error: "A tenant with this name already exists" };
    }

    // Create new tenant
    const { data: newTenant, error: createError } = await adminSupabase
      .from("Tenant")
      .insert({ 
        name: name.trim(),
        subdomain: name.trim().toLowerCase().replace(/\s+/g, '-')
      })
      .select("*")
      .single();

    if (createError) {
      console.error("Error creating tenant:", createError);
      return { error: "Failed to create tenant" };
    }

    return { 
      success: true, 
      tenant: newTenant,
      message: `Tenant "${name}" created successfully` 
    };

  } catch (error) {
    console.error("Error creating tenant:", error);
    return { error: "Internal server error" };
  }
});
