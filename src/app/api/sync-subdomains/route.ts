import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    const tenantId = request.headers.get("x-tenant-id");
    
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    console.log("Syncing subdomains for tenant:", tenantId);

    // Get current tenant data
    const { data: tenantData, error: tenantError } = await supabase
      .from("Tenant")
      .select("id, subdomain")
      .eq("id", tenantId)
      .single();

    if (tenantError) {
      console.error("Error fetching tenant data:", tenantError);
      return NextResponse.json({ error: "Failed to fetch tenant data" }, { status: 500 });
    }

    console.log("Tenant data:", tenantData);

    // Get current website data
    const { data: websiteData, error: websiteError } = await supabase
      .from("kennel_websites")
      .select("id, tenant_id, subdomain")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    console.log("Website data:", websiteData, "Error:", websiteError);

    // Sync the subdomains
    if (websiteData) {
      // Update website subdomain to match tenant
      const { error: updateError } = await supabase
        .from("kennel_websites")
        .update({ subdomain: tenantData.subdomain || "" })
        .eq("tenant_id", tenantId);

      if (updateError) {
        console.error("Error updating website subdomain:", updateError);
        return NextResponse.json({ error: "Failed to update website subdomain" }, { status: 500 });
      }

      console.log("Successfully synced website subdomain to:", tenantData.subdomain);
    } else {
      // Create website record with tenant subdomain
      const { error: createError } = await supabase
        .from("kennel_websites")
        .insert({
          tenant_id: tenantId,
          subdomain: tenantData.subdomain || "",
          hero_title: "Welcome to Our Kennel",
          hero_tagline: "Where your furry friends feel at home"
        } as any);

      if (createError) {
        console.error("Error creating website record:", createError);
        return NextResponse.json({ error: "Failed to create website record" }, { status: 500 });
      }

      console.log("Successfully created website record with subdomain:", tenantData.subdomain);
    }

    return NextResponse.json({
      success: true,
      tenantSubdomain: tenantData.subdomain,
      message: "Subdomains synced successfully"
    });

  } catch (error) {
    console.error("Error syncing subdomains:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
} 