import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    const body = await request.json();
    const { subdomain } = body;

    // Get tenant ID from headers
    const tenantId = request.headers.get("x-tenant-id");
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID required" },
        { status: 400 },
      );
    }

    if (!subdomain) {
      return NextResponse.json(
        { error: "Subdomain is required" },
        { status: 400 },
      );
    }

    // Check if subdomain is already taken by another tenant
    const { data: existingTenant, error: checkError } = await supabase
      .from("Tenant")
      .select("id")
      .eq("subdomain", subdomain)
      .neq("id", tenantId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking subdomain availability:", checkError);
      return NextResponse.json(
        { error: "Failed to check subdomain availability" },
        { status: 500 },
      );
    }

    if (existingTenant) {
      return NextResponse.json(
        { error: "Subdomain is already taken" },
        { status: 400 },
      );
    }

    // Update the tenant's subdomain
    const { error: updateError } = await supabase
      .from("Tenant")
      .update({ subdomain })
      .eq("id", tenantId);

    if (updateError) {
      console.error("Error updating tenant subdomain:", updateError);
      return NextResponse.json(
        { error: "Failed to update subdomain" },
        { status: 500 },
      );
    }

    // Also update the kennel_websites table if it exists
    const { error: websiteError } = await supabase
      .from("kennel_websites")
      .update({ subdomain })
      .eq("tenant_id", tenantId);

    if (websiteError) {
      console.warn("Warning: Could not update kennel_websites subdomain:", websiteError);
      // Don't fail the request if this fails, as the website might not exist yet
    }

    return NextResponse.json({ 
      success: true, 
      subdomain,
      message: "Subdomain updated successfully" 
    });

  } catch (error) {
    console.error("Error updating subdomain:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
} 