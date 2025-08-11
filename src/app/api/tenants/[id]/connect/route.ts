import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const POST = createHandler(async ({ req, client, params }) => {
  try {
    const tenantId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    if (!tenantId) {
      return { error: "Tenant ID is required" };
    }

    // Get current user
    const { data: { user: authUser } } = await client.auth.getUser();
    if (!authUser) {
      return { error: "Not authenticated" };
    }

    const adminSupabase = supabaseAdmin();

    // Verify the user has access to this tenant
    const { data: userRecord } = await adminSupabase
      .from("User")
      .select("id")
      .eq("supabaseUserId", authUser.id)
      .single();

    if (!userRecord) {
      return { error: "User not found" };
    }

    // Check if user has access to this tenant
    const { data: userTenant, error: userTenantError } = await adminSupabase
      .from("UserTenant")
      .select("user_id, tenant_id, role")
      .eq("user_id", userRecord.id)
      .eq("tenant_id", tenantId)
      .single();

    if (userTenantError || !userTenant) {
      return { error: "User does not have access to this tenant" };
    }

    // Update the user's active tenant
    const { error: updateError } = await adminSupabase
      .from("User")
      .update({ tenantId: tenantId })
      .eq("id", userRecord.id);

    if (updateError) {
      console.error("Error updating user tenant:", updateError);
      return { error: "Failed to connect to tenant" };
    }

    console.log(`✅ User ${authUser.email} connected to tenant ${tenantId}`);

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