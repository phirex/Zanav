import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const POST = createHandler(async ({ client }) => {
  try {
    // Get the current user session
    const {
      data: { session },
    } = await client.auth.getSession();

    if (!session?.user) {
      return { error: "No authenticated session found" };
    }

    console.log("[FORCE DELETE] Starting force deletion for user:", session.user.id);

    // Use admin client for full access
    const adminSupabase = supabaseAdmin();

    // 1. Find the user record by email (more reliable than supabaseUserId)
    if (!session.user.email) {
      return { error: "User email not found" };
    }
    
    const { data: userRecord, error: userError } = await adminSupabase
      .from("User")
      .select("*")
      .eq("email", session.user.email)
      .maybeSingle();

    if (userError) {
      console.error("[FORCE DELETE] Error finding user:", userError);
      return { error: "Failed to find user record" };
    }

    if (!userRecord) {
      console.log("[FORCE DELETE] No user record found, deleting from auth only");
      // Delete from Supabase Auth only
      const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(session.user.id);
      if (authDeleteError) {
        console.error("[FORCE DELETE] Auth deletion error:", authDeleteError);
        return { error: "Failed to delete from auth" };
      }
      return { success: true, message: "User deleted from auth only" };
    }

    console.log("[FORCE DELETE] Found user record:", userRecord.id);

    // 2. Delete all related data (in correct order)
    if (userRecord.tenantId) {
      console.log("[FORCE DELETE] Deleting tenant data for:", userRecord.tenantId);

      // Delete kennel website data first
      const { data: websiteData } = await adminSupabase
        .from("kennel_websites")
        .select("id")
        .eq("tenant_id", userRecord.tenantId)
        .maybeSingle();

      if (websiteData?.id) {
        await adminSupabase.from("kennel_website_faqs").delete().eq("website_id", websiteData.id);
        await adminSupabase.from("kennel_website_images").delete().eq("website_id", websiteData.id);
        await adminSupabase.from("kennel_website_videos").delete().eq("website_id", websiteData.id);
        await adminSupabase.from("kennel_website_testimonials").delete().eq("website_id", websiteData.id);
        await adminSupabase.from("kennel_websites").delete().eq("id", websiteData.id);
      }

      // Delete other data
      await adminSupabase.from("ScheduledNotification").delete().eq("tenantId", userRecord.tenantId);
      await adminSupabase.from("Payment").delete().eq("tenantId", userRecord.tenantId);
      await adminSupabase.from("Booking").delete().eq("tenantId", userRecord.tenantId);
      await adminSupabase.from("Dog").delete().eq("tenantId", userRecord.tenantId);
      await adminSupabase.from("Owner").delete().eq("tenantId", userRecord.tenantId);
      await adminSupabase.from("Room").delete().eq("tenantId", userRecord.tenantId);
      await adminSupabase.from("NotificationTemplate").delete().eq("tenantId", userRecord.tenantId);
      await adminSupabase.from("Setting").delete().eq("tenantId", userRecord.tenantId);
      await adminSupabase.from("ClientSource").delete().eq("tenantId", userRecord.tenantId);
      await adminSupabase.from("UserTenant").delete().eq("tenant_id", userRecord.tenantId);
      await adminSupabase.from("Tenant").delete().eq("id", userRecord.tenantId);
    }

    // 3. Delete the user record
    const { error: deleteUserError } = await adminSupabase
      .from("User")
      .delete()
      .eq("id", userRecord.id);

    if (deleteUserError) {
      console.error("[FORCE DELETE] Error deleting user record:", deleteUserError);
      return { error: "Failed to delete user record" };
    }

    // 4. Delete from Supabase Auth
    const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(session.user.id);
    if (authDeleteError) {
      console.error("[FORCE DELETE] Auth deletion error:", authDeleteError);
      // Don't fail here - user record is already deleted
    }

    console.log("[FORCE DELETE] Force deletion completed successfully");

    return {
      success: true,
      message: "User completely deleted from database and auth"
    };

  } catch (error) {
    console.error("[FORCE DELETE] Exception:", error);
    return {
      error: "Exception occurred",
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}); 