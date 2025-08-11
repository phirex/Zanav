import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ApiError } from "@/lib/apiHandler";

export const POST = createHandler(async ({ client }) => {
  // Get the current user session
  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session?.user) {
    throw new ApiError("unauthorized", "User not authenticated");
  }

  console.log("[DELETE ACCOUNT] Starting account deletion for user:", session.user.id);

  try {
    // Use admin client for full access
    const adminSupabase = supabaseAdmin();

    // 1. Get the user's tenant ID and other details
    const { data: userRecord, error: userError } = await adminSupabase
      .from("User")
      .select("id, tenantId, supabaseUserId")
      .eq("supabaseUserId", session.user.id)
      .single();

    if (userError) {
      console.error("[DELETE ACCOUNT] Error fetching user record:", userError);
      throw new ApiError("user_not_found", "User record not found");
    }

    if (!userRecord) {
      throw new ApiError("user_not_found", "User record not found");
    }

    console.log("[DELETE ACCOUNT] Found user record:", userRecord.id, "tenant:", userRecord.tenantId);

    // 2. Delete all data associated with the user's tenant
    if (userRecord.tenantId) {
      console.log("[DELETE ACCOUNT] Deleting tenant data for:", userRecord.tenantId);

      // Delete in order to respect foreign key constraints
      
      // Delete scheduled notifications
      await adminSupabase
        .from("ScheduledNotification")
        .delete()
        .eq("tenantId", userRecord.tenantId);

      // Delete payments
      await adminSupabase
        .from("Payment")
        .delete()
        .eq("tenantId", userRecord.tenantId);

      // Delete bookings
      await adminSupabase
        .from("Booking")
        .delete()
        .eq("tenantId", userRecord.tenantId);

      // Delete dogs
      await adminSupabase
        .from("Dog")
        .delete()
        .eq("tenantId", userRecord.tenantId);

      // Delete owners
      await adminSupabase
        .from("Owner")
        .delete()
        .eq("tenantId", userRecord.tenantId);

      // Delete rooms
      await adminSupabase
        .from("Room")
        .delete()
        .eq("tenantId", userRecord.tenantId);

      // Delete notification templates
      await adminSupabase
        .from("NotificationTemplate")
        .delete()
        .eq("tenantId", userRecord.tenantId);

      // Delete settings
      await adminSupabase
        .from("Setting")
        .delete()
        .eq("tenantId", userRecord.tenantId);

      // Delete client sources
      await adminSupabase
        .from("ClientSource")
        .delete()
        .eq("tenantId", userRecord.tenantId);

      // Delete kennel website data
      await adminSupabase
        .from("kennel_website_faqs")
        .delete()
        .eq("website_id", (await adminSupabase
          .from("kennel_websites")
          .select("id")
          .eq("tenant_id", userRecord.tenantId)
          .single())?.data?.id || "00000000-0000-0000-0000-000000000000");

      await adminSupabase
        .from("kennel_website_images")
        .delete()
        .eq("website_id", (await adminSupabase
          .from("kennel_websites")
          .select("id")
          .eq("tenant_id", userRecord.tenantId)
          .single())?.data?.id || "00000000-0000-0000-0000-000000000000");

      await adminSupabase
        .from("kennel_website_videos")
        .delete()
        .eq("website_id", (await adminSupabase
          .from("kennel_websites")
          .select("id")
          .eq("tenant_id", userRecord.tenantId)
          .single())?.data?.id || "00000000-0000-0000-0000-000000000000");

      await adminSupabase
        .from("kennel_website_testimonials")
        .delete()
        .eq("website_id", (await adminSupabase
          .from("kennel_websites")
          .select("id")
          .eq("tenant_id", userRecord.tenantId)
          .single())?.data?.id || "00000000-0000-0000-0000-000000000000");

      await adminSupabase
        .from("kennel_websites")
        .delete()
        .eq("tenant_id", userRecord.tenantId);

      // Delete user-tenant links
      await adminSupabase
        .from("UserTenant")
        .delete()
        .eq("tenant_id", userRecord.tenantId);

      // Delete the tenant
      await adminSupabase
        .from("Tenant")
        .delete()
        .eq("id", userRecord.tenantId);

      console.log("[DELETE ACCOUNT] Tenant data deleted successfully");
    }

    // 3. Delete the user record
    console.log("[DELETE ACCOUNT] Deleting user record:", userRecord.id);
    const { error: deleteUserError } = await adminSupabase
      .from("User")
      .delete()
      .eq("id", userRecord.id);

    if (deleteUserError) {
      console.error("[DELETE ACCOUNT] Error deleting user record:", deleteUserError);
      throw new ApiError("user_deletion_failed", "Failed to delete user record");
    }

    // 4. Delete the user from Supabase Auth
    console.log("[DELETE ACCOUNT] Deleting user from Supabase Auth:", session.user.id);
    const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(session.user.id);

    if (authDeleteError) {
      console.error("[DELETE ACCOUNT] Error deleting auth user:", authDeleteError);
      // Don't throw here - the user record is already deleted
      console.warn("[DELETE ACCOUNT] Warning: Auth user deletion failed, but user record was deleted");
    }

    console.log("[DELETE ACCOUNT] Account deletion completed successfully");

    return {
      success: true,
      message: "Account deleted successfully"
    };

  } catch (error) {
    console.error("[DELETE ACCOUNT] Error during account deletion:", error);
    throw error;
  }
}); 