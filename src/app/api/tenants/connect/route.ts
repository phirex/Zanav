import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const POST = createHandler(async ({ req, client, body }) => {
  try {
    console.log('🔗 [CONNECT] Starting tenant connection...');
    console.log('🔗 [CONNECT] Request body:', body);
    
    const { tenantId } = body;
    console.log('🔗 [CONNECT] Tenant ID from body:', tenantId);
    
    if (!tenantId) {
      console.log('❌ [CONNECT] No tenant ID provided in request body');
      return { error: "Tenant ID is required in request body" };
    }
    
    console.log('🔗 [CONNECT] Tenant ID:', tenantId);

    // Get current user
    const { data: { user: authUser } } = await client.auth.getUser();
    if (!authUser) {
      console.log('❌ [CONNECT] No authenticated user');
      return { error: "Not authenticated" };
    }
    
    console.log('🔗 [CONNECT] Auth user:', authUser.email);

    const adminSupabase = supabaseAdmin();

    // Verify the user has access to this tenant
    const { data: userRecord, error: userError } = await adminSupabase
      .from("User")
      .select("id")
      .eq("supabaseUserId", authUser.id)
      .single();

    if (userError || !userRecord) {
      console.log('❌ [CONNECT] User not found:', userError);
      return { error: "User not found" };
    }
    
    console.log('🔗 [CONNECT] User record found:', userRecord.id);

    // Check if user has access to this tenant
    const { data: userTenant, error: userTenantError } = await adminSupabase
      .from("UserTenant")
      .select("user_id, tenant_id, role")
      .eq("user_id", userRecord.id)
      .eq("tenant_id", tenantId)
      .single();

    if (userTenantError || !userTenant) {
      console.log('❌ [CONNECT] UserTenant access check failed:', userTenantError);
      return { error: "User does not have access to this tenant" };
    }
    
    console.log('🔗 [CONNECT] UserTenant access confirmed:', userTenant);

    // Update the user's active tenant
    const { error: updateError } = await adminSupabase
      .from("User")
      .update({ tenantId: tenantId })
      .eq("id", userRecord.id);

    if (updateError) {
      console.error("Error updating user tenant:", updateError);
      return { error: "Failed to connect to tenant" };
    }

    console.log(`✅ [CONNECT] User ${authUser.email} connected to tenant ${tenantId}`);

    return { 
      success: true, 
      message: "Connected to tenant successfully",
      tenantId: tenantId,
      role: userTenant.role
    };

  } catch (error) {
    console.error("Error in tenant connect API:", error);
    return { error: "Internal server error" };
  }
});
