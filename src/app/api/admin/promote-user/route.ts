import { createAdminHandlerWithAuth } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const POST = createAdminHandlerWithAuth(async (ctx) => {
  try {
    const { email, name } = ctx.body || {};
    
    if (!email) {
      return { error: "Email is required" };
    }

    const adminSupabase = supabaseAdmin();

    // Check if user already exists in GlobalAdmin table
    const { data: existingAdmin, error: checkError } = await adminSupabase
      .from("GlobalAdmin")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing global admin:", checkError);
      return { error: "Failed to check existing admin status" };
    }

    if (existingAdmin) {
      return { error: "User is already a global admin" };
    }

    // Get the user's Supabase ID from the User table
    const { data: user, error: userError } = await adminSupabase
      .from("User")
      .select("supabaseUserId")
      .eq("email", email)
      .maybeSingle();

    if (userError) {
      console.error("Error finding user:", userError);
      return { error: "User not found" };
    }

    if (!user?.supabaseUserId) {
      return { error: "User not found or not properly linked to Supabase" };
    }

    // Insert into GlobalAdmin table
    const { data: newAdmin, error: insertError } = await adminSupabase
      .from("GlobalAdmin")
      .insert({
        email: email,
        name: name || email.split('@')[0],
        supabaseUserId: user.supabaseUserId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating global admin:", insertError);
      return { error: "Failed to create global admin" };
    }

    return { 
      success: true, 
      message: "User promoted to global admin successfully",
      admin: newAdmin 
    };

  } catch (error) {
    console.error("Error in promote-user API:", error);
    return { error: "Internal server error" };
  }
}); 