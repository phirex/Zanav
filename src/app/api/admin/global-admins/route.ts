import { createAdminHandlerWithAuth } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createAdminHandlerWithAuth(async () => {
  try {
    const adminSupabase = supabaseAdmin();

    const { data: admins, error } = await adminSupabase
      .from("GlobalAdmin")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching global admins:", error);
      throw new Error("Failed to fetch global admins");
    }

    return { admins: admins || [] };

  } catch (error) {
    console.error("Error in global-admins API:", error);
    return { admins: [] };
  }
}); 