import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }
  try {
    console.log("Testing Supabase connection...");

    // Create Supabase client
    const supabase = supabaseServer();

    // Get tenant ID from headers
    const tenantId = request.headers.get("x-tenant-id");
    console.log("Tenant ID from headers:", tenantId);

    // Remove set_tenant RPC call; rely on explicit tenantId filtering
    // if (tenantId) {
    //   try {
    //     console.log("Setting tenant context:", tenantId);
    //     await supabase.rpc("set_tenant", { _tenant_id: tenantId });
    //     console.log("Tenant context set successfully");
    //   } catch (error) {
    //     console.error("Error setting tenant context:", error);
    //   }
    // }

    // Test query to fetch tenants
    let tenantsQuery = supabase.from("Tenant").select("*");
    if (tenantId) {
      tenantsQuery = tenantsQuery.eq("id", tenantId);
    }
    const { data: tenants, error: tenantsError } = await tenantsQuery;

    if (tenantsError) {
      console.error("Error fetching tenants:", tenantsError);
      return NextResponse.json(
        { error: tenantsError.message },
        { status: 500 },
      );
    }

    // Test query to fetch bookings
    let bookingsQuery = supabase
      .from("Booking")
      .select("id, startDate, endDate")
      .limit(5);
    if (tenantId) {
      bookingsQuery = bookingsQuery.eq("tenantId", tenantId);
    }
    const { data: bookings, error: bookingsError } = await bookingsQuery;

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
    }

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      tenants: tenants || [],
      bookingsCount: bookings?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error testing database connection:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export { dynamic } from "@/lib/forceDynamic";
