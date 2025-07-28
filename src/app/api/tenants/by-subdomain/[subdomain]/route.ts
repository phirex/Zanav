import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { subdomain: string } },
) {
  try {
    console.log("GET /api/tenants/by-subdomain/[subdomain] called");
    console.log("Subdomain:", params.subdomain);

    const supabase = supabaseServer();

    // Get tenant by subdomain
    const { data: tenant, error } = await supabase
      .from("Tenant")
      .select("id, name, subdomain")
      .eq("subdomain", params.subdomain)
      .single();

    if (error) {
      console.error("Error fetching tenant by subdomain:", error);
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    console.log("Found tenant:", tenant);

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("Error in tenant by subdomain API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
