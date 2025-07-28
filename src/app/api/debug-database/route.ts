import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    const tenantId = request.headers.get("x-tenant-id");
    
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    console.log("Debug database - checking tenant ID:", tenantId);

    // Check current user context
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("Current user:", user?.id, "Error:", userError);

    // Check Tenant table with RLS disabled (if possible)
    const { data: tenantData, error: tenantError } = await supabase
      .from("Tenant")
      .select("*")
      .eq("id", tenantId);

    console.log("Tenant data (all records):", tenantData, "Error:", tenantError);

    // Check kennel_websites table
    const { data: websiteData, error: websiteError } = await supabase
      .from("kennel_websites")
      .select("*")
      .eq("tenant_id", tenantId);

    console.log("Website data (all records):", websiteData, "Error:", websiteError);

    // Check UserTenant table
    const { data: userTenantData, error: userTenantError } = await supabase
      .from("UserTenant")
      .select("*")
      .eq("tenant_id", tenantId);

    console.log("UserTenant data:", userTenantData, "Error:", userTenantError);

    // Try to get all tenants (to see if there are multiple)
    const { data: allTenants, error: allTenantsError } = await supabase
      .from("Tenant")
      .select("id, name, subdomain")
      .order("created_at", { ascending: false })
      .limit(10);

    console.log("All tenants (recent 10):", allTenants, "Error:", allTenantsError);

    // Try to get all websites (to see if there are multiple)
    const { data: allWebsites, error: allWebsitesError } = await supabase
      .from("kennel_websites")
      .select("id, tenant_id, subdomain")
      .order("created_at", { ascending: false })
      .limit(10);

    console.log("All websites (recent 10):", allWebsites, "Error:", allWebsitesError);

    return NextResponse.json({
      tenantId,
      user: user?.id,
      tenant: tenantData,
      website: websiteData,
      userTenant: userTenantData,
      allTenants,
      allWebsites,
      errors: {
        user: userError,
        tenant: tenantError,
        website: websiteError,
        userTenant: userTenantError,
        allTenants: allTenantsError,
        allWebsites: allWebsitesError
      }
    });

  } catch (error) {
    console.error("Error in debug database API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
} 