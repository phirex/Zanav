import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    const body = await request.json();
    const { subdomain } = body;
    const tenantId = request.headers.get("x-tenant-id");
    
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    console.log("Test subdomain update:", { tenantId, subdomain });

    // First, check current state
    const { data: currentTenant, error: tenantError } = await supabase
      .from("Tenant")
      .select("id, subdomain")
      .eq("id", tenantId)
      .single();

    console.log("Current tenant data:", currentTenant, "Error:", tenantError);

    // Update tenant subdomain
    const { data: updateResult, error: updateError } = await supabase
      .from("Tenant")
      .update({ subdomain })
      .eq("id", tenantId)
      .select();

    console.log("Update result:", updateResult, "Error:", updateError);

    // Check what it looks like after update
    const { data: afterUpdate, error: afterError } = await supabase
      .from("Tenant")
      .select("id, subdomain")
      .eq("id", tenantId)
      .single();

    console.log("After update:", afterUpdate, "Error:", afterError);

    return NextResponse.json({
      success: true,
      before: currentTenant,
      after: afterUpdate,
      updateResult,
      errors: {
        tenant: tenantError,
        update: updateError,
        after: afterError
      }
    });

  } catch (error) {
    console.error("Error in test subdomain update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
} 