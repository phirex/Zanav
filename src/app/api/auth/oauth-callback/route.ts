import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { user } = await request.json();
    
    if (!user) {
      return NextResponse.json(
        { error: "No user data provided" },
        { status: 400 }
      );
    }

    console.log("[OAUTH_CALLBACK] Processing OAuth user:", user.email);

    const adminSupabase = supabaseAdmin();

    // Check if user already exists in our User table
    const { data: existingUser, error: checkError } = await adminSupabase
      .from("User")
      .select("id, email")
      .eq("supabaseUserId", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("[OAUTH_CALLBACK] Error checking existing user:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing user" },
        { status: 500 }
      );
    }

    // If user doesn't exist, create a new User record
    if (!existingUser) {
      console.log("[OAUTH_CALLBACK] Creating new user record for OAuth user");

      const { data: userRecord, error: userError } = await adminSupabase
        .from("User")
        .insert({
          supabaseUserId: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          firstName: user.user_metadata?.first_name || user.email?.split("@")[0] || "",
          lastName: user.user_metadata?.last_name || "",
        })
        .select("id")
        .single();

      if (userError) {
        console.error("[OAUTH_CALLBACK] User record creation error:", userError);
        return NextResponse.json(
          { error: "Failed to create user record" },
          { status: 500 }
        );
      }

      console.log("[OAUTH_CALLBACK] Created user record:", userRecord.id);
    } else {
      console.log("[OAUTH_CALLBACK] User already exists:", existingUser.id);
    }

    return NextResponse.json({
      success: true,
      message: "OAuth user processed successfully"
    });

  } catch (error) {
    console.error("[OAUTH_CALLBACK] Error processing OAuth user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 