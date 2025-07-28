#!/usr/bin/env node

/**
 * Admin Setup Script
 *
 * This script allows you to promote a user to ADMIN or OWNER role.
 * Usage: node admin_setup.js <user_email> <role>
 *
 * Example: node admin_setup.js admin@example.com OWNER
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Validate arguments
const userEmail = process.argv[2];
const targetRole = process.argv[3]?.toUpperCase() || "OWNER";

if (!userEmail) {
  console.error("Error: User email is required");
  console.log("Usage: node admin_setup.js <user_email> <role>");
  process.exit(1);
}

if (!["OWNER", "ADMIN", "STAFF", "VIEWER"].includes(targetRole)) {
  console.error("Error: Role must be one of: OWNER, ADMIN, STAFF, VIEWER");
  process.exit(1);
}

// Initialize Supabase client with service role key for elevated permissions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function makeUserAdmin() {
  try {
    console.log(`Promoting user ${userEmail} to ${targetRole}...`);

    // Get the user ID from the auth.users table
    const { data: authUser, error: authError } = await supabase
      .from("auth.users")
      .select("id")
      .eq("email", userEmail)
      .single();

    if (authError || !authUser) {
      console.error("Error: User not found in auth database");
      process.exit(1);
    }

    // Get the user from the users table
    const { data: user, error: userError } = await supabase
      .from("user")
      .select("id")
      .eq("email", userEmail)
      .single();

    if (userError) {
      console.error("Error: User not found in application database");
      process.exit(1);
    }

    // Get or create tenant record
    const { data: tenant, error: tenantError } = await supabase
      .from("tenant")
      .select("id")
      .limit(1)
      .single();

    let tenantId;

    if (tenantError) {
      // Create tenant if it doesn't exist
      const { data: newTenant, error: newTenantError } = await supabase
        .from("tenant")
        .insert([{ name: "Default Tenant" }])
        .select()
        .single();

      if (newTenantError) {
        console.error("Error creating tenant:", newTenantError);
        process.exit(1);
      }

      tenantId = newTenant.id;
    } else {
      tenantId = tenant.id;
    }

    // Update or create the UserTenant record with the OWNER role
    const { data: userTenant, error: userTenantError } = await supabase
      .from("user_tenant")
      .upsert([
        {
          userId: user.id,
          tenantId: tenantId,
          role: targetRole,
        },
      ])
      .select();

    if (userTenantError) {
      console.error("Error updating user role:", userTenantError);
      process.exit(1);
    }

    console.log(
      `Success! User ${userEmail} has been promoted to ${targetRole}`,
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    process.exit(1);
  }
}

makeUserAdmin();
