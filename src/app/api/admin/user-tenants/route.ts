import { createAdminHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createAdminHandler(async (ctx) => {
  try {
    const adminSupabase = supabaseAdmin();

    // Get the current user's session to find their user ID
    const { data: { session } } = await adminSupabase.auth.getSession();
    
    if (!session?.user) {
      return { error: "Not authenticated" };
    }

    const supabaseUserId = session.user.id;

    // Find the user record
    const { data: user, error: userError } = await adminSupabase
      .from("User")
      .select("id")
      .eq("supabaseUserId", supabaseUserId)
      .single();

    if (userError || !user) {
      return { error: "User not found" };
    }

    // Get all tenants this user has access to
    const { data: userTenants, error: userTenantError } = await adminSupabase
      .from("UserTenant")
      .select(`
        tenant_id,
        role,
        Tenant!inner(
          id,
          name,
          subdomain,
          createdAt
        )
      `)
      .eq("user_id", user.id);

    if (userTenantError) {
      console.error("Error fetching user tenants:", userTenantError);
      return { error: "Failed to fetch user tenants" };
    }

    // Transform the data
    const tenants = userTenants?.map(ut => ({
      id: ut.Tenant.id,
      name: ut.Tenant.name,
      subdomain: ut.Tenant.subdomain,
      createdAt: ut.Tenant.createdAt,
      role: ut.role,
      ownerEmail: session.user.email
    })) || [];

    return { tenants };

  } catch (error) {
    console.error("Error in user-tenants API:", error);
    return { error: "Internal server error" };
  }
}); 