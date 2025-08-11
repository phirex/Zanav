import { createHandler } from "@/lib/apiHandler";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log("🆕 Create Google User API called");
  
  try {
    const { supabaseUserId, email, name } = await request.json();
    
    if (!supabaseUserId || !email) {
      console.error("❌ Missing required fields:", { supabaseUserId, email });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("📋 Creating user with:", { supabaseUserId, email, name });

    const adminSupabase = supabaseAdmin();

    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await adminSupabase
      .from("User")
      .select("id, tenantId")
      .eq("supabaseUserId", supabaseUserId)
      .maybeSingle();

    if (userCheckError) {
      console.error("❌ Error checking existing user:", userCheckError);
      return NextResponse.json(
        { error: "Database error checking user" },
        { status: 500 }
      );
    }

    if (existingUser) {
      console.log("✅ User already exists:", existingUser.id);
      return NextResponse.json({
        message: "User already exists",
        userId: existingUser.id,
        redirectTo: existingUser.tenantId ? '/dashboard' : '/kennel-setup'
      });
    }

    // Check if user exists by email (for users who signed up before Google OAuth)
    const { data: existingUserByEmail, error: emailCheckError } = await adminSupabase
      .from("User")
      .select("id, tenantId")
      .eq("email", email)
      .maybeSingle();

    if (emailCheckError) {
      console.error("❌ Error checking user by email:", emailCheckError);
      return NextResponse.json(
        { error: "Database error checking email" },
        { status: 500 }
      );
    }

    let userId: string;
    let tenantId: string | null = null;

    if (existingUserByEmail) {
      console.log("🔄 User exists by email, updating supabaseUserId...");
      
      const { error: updateError } = await adminSupabase
        .from("User")
        .update({ supabaseUserId })
        .eq("id", existingUserByEmail.id);

      if (updateError) {
        console.error("❌ Failed to update supabaseUserId:", updateError);
        return NextResponse.json(
          { error: "Failed to update user" },
          { status: 500 }
        );
      }

      userId = existingUserByEmail.id;
      tenantId = existingUserByEmail.tenantId;
      console.log("✅ Updated existing user with supabaseUserId");
    } else {
      console.log("🆕 Creating completely new user and tenant...");
      
      // Create new tenant
      const { data: newTenant, error: tenantError } = await adminSupabase
        .from("Tenant")
        .insert({
          name: `Kennel for ${email}`,
          subdomain: null
        })
        .select()
        .single();

      if (tenantError) {
        console.error("❌ Failed to create tenant:", tenantError);
        return NextResponse.json(
          { error: "Failed to create tenant" },
          { status: 500 }
        );
      }

      console.log("✅ Created new tenant:", newTenant.id);

      // Create new user
      const { data: newUser, error: userError } = await adminSupabase
        .from("User")
        .insert({
          email: email,
          name: name,
          supabaseUserId: supabaseUserId,
          tenantId: newTenant.id
        })
        .select()
        .single();

      if (userError) {
        console.error("❌ Failed to create user:", userError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }

      console.log("✅ Created new user:", newUser.id);

      // Create UserTenant link
      const { error: linkError } = await adminSupabase
        .from("UserTenant")
        .insert({
          user_id: newUser.id,
          tenant_id: newTenant.id,
          role: 'admin'
        });

      if (linkError) {
        console.error("❌ Failed to create UserTenant link:", linkError);
        return NextResponse.json(
          { error: "Failed to create user-tenant link" },
          { status: 500 }
        );
      }

      console.log("✅ Created UserTenant link");

      userId = newUser.id;
      tenantId = newTenant.id;
    }

    // Determine redirect path
    let redirectTo = '/dashboard';
    
    if (tenantId) {
      console.log("🔍 Checking if tenant has rooms...");
      const { data: rooms, error: roomsError } = await adminSupabase
        .from("Room")
        .select("id")
        .eq("tenantId", tenantId);

      if (roomsError) {
        console.error("❌ Rooms lookup error:", roomsError);
      } else if (!rooms || rooms.length === 0) {
        console.log("🏗️ No rooms found, redirecting to kennel setup");
        redirectTo = '/kennel-setup';
      } else {
        console.log(`✅ Found ${rooms.length} rooms, redirecting to dashboard`);
      }
    } else {
      console.log("⚠️ No tenant ID, redirecting to kennel setup");
      redirectTo = '/kennel-setup';
    }

    console.log("✅ User creation completed successfully");
    return NextResponse.json({
      message: "User created successfully",
      userId,
      tenantId,
      redirectTo
    });

  } catch (error) {
    console.error("💥 Create Google User API exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 