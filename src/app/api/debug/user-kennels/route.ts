import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createHandler(async ({ req, client }) => {
  try {
    const adminSupabase = supabaseAdmin();
    
    // Get current user
    const { data: { user: authUser } } = await client.auth.getUser();
    if (!authUser) {
      return { error: "Not authenticated" };
    }

    console.log("🔍 Debug: Checking kennels for user:", authUser.email);

    // Check User table
    const { data: userRecord, error: userError } = await adminSupabase
      .from("User")
      .select("*")
      .eq("supabaseUserId", authUser.id)
      .single();

    console.log("🔍 Debug: User record:", userRecord, "Error:", userError);

    if (userError || !userRecord) {
      return { 
        error: "User not found in User table",
        userError: userError?.message,
        supabaseUserId: authUser.id,
        email: authUser.email
      };
    }

    // Check UserTenant table
    const { data: userTenants, error: userTenantError } = await adminSupabase
      .from("UserTenant")
      .select(`
        user_id,
        tenant_id,
        role,
        Tenant(
          id,
          name,
          subdomain,
          createdAt
        )
      `)
      .eq("user_id", userRecord.id);

    console.log("🔍 Debug: UserTenants:", userTenants, "Error:", userTenantError);

    // Check Tenant table directly
    const { data: allTenants, error: tenantsError } = await adminSupabase
      .from("Tenant")
      .select("*");

    console.log("🔍 Debug: All tenants in system:", allTenants?.length || 0);

    return {
      user: {
        id: userRecord.id,
        email: userRecord.email,
        supabaseUserId: userRecord.supabaseUserId,
        tenantId: userRecord.tenantId
      },
      userTenants: userTenants || [],
      allTenantsCount: allTenants?.length || 0,
      errors: {
        userError: userError?.message || null,
        userTenantError: userTenantError?.message || null,
        tenantsError: tenantsError?.message || null
      }
    };

  } catch (error) {
    console.error("Error in debug user-kennels API:", error);
    return { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' };
  }
}); 