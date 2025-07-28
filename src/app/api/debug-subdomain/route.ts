import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    const tenantId = request.headers.get("x-tenant-id");
    
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    console.log("Debug subdomain - checking tenant ID:", tenantId);

    // Check Tenant table
    const { data: tenantData, error: tenantError } = await supabase
      .from("Tenant")
      .select("id, subdomain")
      .eq("id", tenantId)
      .single();

    console.log("Tenant data:", tenantData, "Error:", tenantError);

    // Check kennel_websites table
    const { data: websiteData, error: websiteError } = await supabase
      .from("kennel_websites")
      .select("id, tenant_id, subdomain")
      .eq("tenant_id", tenantId)
      .single();

    console.log("Website data:", websiteData, "Error:", websiteError);

    return NextResponse.json({
      tenantId,
      tenant: tenantData,
      website: websiteData,
      errors: {
        tenant: tenantError,
        website: websiteError
      }
    });

  } catch (error) {
    console.error("Error in debug subdomain API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
} 