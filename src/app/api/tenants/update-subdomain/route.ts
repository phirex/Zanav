import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

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

    console.log("Updating tenant subdomain:", { tenantId, subdomain });
    
    // Update the tenant's subdomain
    const { data: updateResult, error: updateError } = await supabase
      .from("Tenant")
      .update({ subdomain })
      .eq("id", tenantId)
      .select();

    if (updateError) {
      console.error("Error updating tenant subdomain:", updateError);
      return NextResponse.json(
        { error: "Failed to update subdomain" },
        { status: 500 },
      );
    }

    console.log("Tenant update result:", updateResult);

    // First, check if kennel_websites record exists
    const { data: existingWebsite, error: checkWebsiteError } = await supabase
      .from("kennel_websites")
      .select("id")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    console.log("Existing website record:", existingWebsite, "Error:", checkWebsiteError);

    if (existingWebsite) {
      // Update existing kennel_websites record
      const { error: websiteError } = await supabase
        .from("kennel_websites")
        .update({ subdomain })
        .eq("tenant_id", tenantId);

      if (websiteError) {
        console.error("Error updating kennel_websites subdomain:", websiteError);
        return NextResponse.json(
          { error: "Failed to update website subdomain" },
          { status: 500 },
        );
      }
      console.log("Successfully updated kennel_websites subdomain");
    } else {
      // Create new kennel_websites record
      const { error: createError } = await supabase
        .from("kennel_websites")
        .insert({
          tenant_id: tenantId,
          subdomain: subdomain,
          hero_title: "Welcome to Our Kennel",
          hero_tagline: "Where your furry friends feel at home"
        });

      if (createError) {
        console.error("Error creating kennel_websites record:", createError);
        return NextResponse.json(
          { error: "Failed to create website record" },
          { status: 500 },
        );
      }
      console.log("Successfully created new kennel_websites record");
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