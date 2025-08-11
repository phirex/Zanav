import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log("🔍 Check User Exists API called");
  
  try {
    const { supabaseUserId, email } = await request.json();
    
    if (!supabaseUserId || !email) {
      console.error("❌ Missing required fields:", { supabaseUserId, email });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("🔍 Checking for user with:", { supabaseUserId, email });

    const adminSupabase = supabaseAdmin();

    // Check if user exists by supabaseUserId
    const { data: existingUser, error: userCheckError } = await adminSupabase
      .from("User")
      .select("id, tenantId")
      .eq("supabaseUserId", supabaseUserId)
      .maybeSingle();

    if (userCheckError) {
      console.error("❌ Error checking user by supabaseUserId:", userCheckError);
      return NextResponse.json(
        { error: "Database error checking user", details: userCheckError },
        { status: 500 }
      );
    }

    if (existingUser) {
      console.log("✅ User found by supabaseUserId:", existingUser.id);
      return NextResponse.json({
        user: existingUser,
        error: null
      });
    }

    // Check if user exists by email
    const { data: existingUserByEmail, error: emailCheckError } = await adminSupabase
      .from("User")
      .select("id, tenantId")
      .eq("email", email)
      .maybeSingle();

    if (emailCheckError) {
      console.error("❌ Error checking user by email:", emailCheckError);
      return NextResponse.json(
        { error: "Database error checking email", details: emailCheckError },
        { status: 500 }
      );
    }

    if (existingUserByEmail) {
      console.log("✅ User found by email:", existingUserByEmail.id);
      return NextResponse.json({
        user: existingUserByEmail,
        error: null
      });
    }

    console.log("🔍 No user found in database");
    return NextResponse.json({
      user: null,
      error: null
    });

  } catch (error) {
    console.error("💥 Check User Exists API exception:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
} 