#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

async function main() {
  console.log("Testing Supabase connection...");

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
    );
    process.exit(1);
  }

  // Create Supabase client with service role key
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
      },
    },
  );

  try {
    // Set tenant context
    await supabase.rpc("set_tenant_context", {
      tenant_id: "00000000-0000-0000-0000-000000000000",
    });
    console.log("Successfully set tenant context");

    // Test query to fetch tenants
    const { data, error } = await supabase.from("Tenant").select("*");

    if (error) {
      console.error("Error fetching tenants:", error);
      process.exit(1);
    }

    console.log("Successfully fetched tenants:");
    console.log(data);

    // Test query to fetch bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from("Booking")
      .select("id, startDate, endDate")
      .limit(5);

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
    } else {
      console.log("Successfully fetched bookings:");
      console.log(bookings);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    process.exit(1);
  }
}

main();
