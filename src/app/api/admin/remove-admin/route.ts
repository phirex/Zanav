import { createAdminHandlerWithAuth } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const POST = createAdminHandlerWithAuth(async (ctx) => {
  try {
    const { adminId } = ctx.body || {};
    
    if (!adminId) {
      return { error: "Admin ID is required" };
    }

    const adminSupabase = supabaseAdmin();

    // Remove from GlobalAdmin table
    const { error: deleteError } = await adminSupabase
      .from("GlobalAdmin")
      .delete()
      .eq("id", adminId);

    if (deleteError) {
      console.error("Error removing admin:", deleteError);
      return { error: "Failed to remove admin status" };
    }

    return { 
      success: true, 
      message: "Admin status removed successfully" 
    };

  } catch (error) {
    console.error("Error in remove-admin API:", error);
    return { error: "Internal server error" };
  }
}); 