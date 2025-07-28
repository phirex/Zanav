import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/auth";

export async function POST() {
  try {
    const client = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminClient = supabaseAdmin();

    // 1. Get or create User record
    let { data: userRecord } = await adminClient
      .from("User")
      .select("id")
      .eq("supabaseUserId", user.id)
      .single();

    if (!userRecord) {
      const { data: newUser, error: userError } = await adminClient
        .from("User")
        .insert({
          supabaseUserId: user.id,
          email: user.email,
          name: user.email?.split("@")[0] || "User",
        })
        .select("id")
        .single();

      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 });
      }
      userRecord = newUser;
    }

    // 2. Create a default tenant
    const { data: tenant, error: tenantError } = await adminClient
      .from("Tenant")
      .insert({
        name: "My Kennel",
        subdomain: `kennel-${Date.now()}`,
      })
      .select("id")
      .single();

    if (tenantError) {
      return NextResponse.json({ error: tenantError.message }, { status: 500 });
    }

    // 3. Link user to tenant
    const { error: linkError } = await adminClient
      .from("UserTenant")
      .insert({
        user_id: userRecord.id,
        tenant_id: tenant.id,
        role: "OWNER",
      });

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    // 4. Create default settings
    await adminClient.from("Setting").insert([
      { key: "kennelName", value: "My Kennel", tenantId: tenant.id },
      { key: "currency", value: "USD", tenantId: tenant.id },
      { key: "timezone", value: "UTC", tenantId: tenant.id },
    ]);

    // 5. Create default rooms
    await adminClient.from("Room").insert([
      { name: "Room 1", displayName: "Room 1", capacity: 1, maxCapacity: 1, tenantId: tenant.id },
      { name: "Room 2", displayName: "Room 2", capacity: 1, maxCapacity: 1, tenantId: tenant.id },
    ]);

    return NextResponse.json({ 
      success: true, 
      tenantId: tenant.id,
      message: "User fixed and linked to new tenant" 
    });

  } catch (error: any) {
    console.error("Fix user error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 