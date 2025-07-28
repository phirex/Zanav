import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ApiError } from "@/lib/apiHandler";

interface SignupRequest {
  email: string;
  password: string;
}

export const POST = createHandler(async ({ body }) => {
  const { email, password } = body as SignupRequest;

  if (!email || !password) {
    throw new ApiError("missing_fields", "Email and password are required");
  }

  console.log("[SIGNUP] Starting complete signup flow for:", email);

  // Use admin client for full access
  const adminSupabase = supabaseAdmin();

  try {
    // 0. Check if user already exists
    console.log("[SIGNUP] Checking if user already exists...");
    const { data: existingUser, error: checkError } = await adminSupabase
      .from("User")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("[SIGNUP] Error checking existing user:", checkError);
      throw new ApiError(
        "user_check_failed",
        `Failed to check existing user: ${checkError.message}`,
      );
    }

    if (existingUser) {
      throw new ApiError(
        "email_already_exists",
        "An account with this email already exists",
      );
    }

    // 1. Create user in Supabase Auth
    console.log("[SIGNUP] Creating auth user...");
    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for demo
        user_metadata: {
          name: email.split("@")[0], // Use email prefix as initial name
        },
      });

    if (authError || !authData.user) {
      throw new ApiError(
        "auth_user_creation_failed",
        `Failed to create auth user: ${authError?.message}`,
      );
    }

    const supabaseUserId = authData.user.id;
    console.log("[SIGNUP] Created auth user:", supabaseUserId);

    // 2. Create User record in our app
    console.log("[SIGNUP] Creating User record...");
    const { data: userRecord, error: userError } = await adminSupabase
      .from("User")
      .insert({
        supabaseUserId,
        email,
        name: email.split("@")[0],
        firstName: email.split("@")[0],
        lastName: "",
      })
      .select("id")
      .single();

    if (userError) {
      console.error("[SIGNUP] User record creation error:", userError);

      // Handle specific error cases
      if (userError.code === "23505") {
        // Unique constraint violation
        throw new ApiError(
          "email_already_exists",
          "An account with this email already exists",
        );
      }

      throw new ApiError(
        "user_record_creation_failed",
        `Failed to create user record: ${userError.message}`,
      );
    }

    if (!userRecord) {
      throw new ApiError(
        "user_record_creation_failed",
        "User record was not created",
      );
    }

    console.log("[SIGNUP] Created user record:", userRecord.id);

    // 3. Skip tenant linkage – user will create their kennel in the next step。

    console.log("[SIGNUP] Signup flow finished – awaiting kennel setup");

    return {
      success: true,
      user: {
        id: supabaseUserId,
        email: authData.user.email,
      },
    };
  } catch (error: any) {
    console.error("[SIGNUP] Error during signup flow:", error);

    // If it's already an ApiError, re-throw it
    if (error.code && error.message) {
      throw error;
    }

    // Handle other errors
    if (error.message?.includes("duplicate key")) {
      throw new ApiError(
        "email_already_exists",
        "An account with this email already exists",
      );
    }

    throw new ApiError(
      "signup_failed",
      `Signup failed: ${error.message || "Unknown error"}`,
    );
  }
});
