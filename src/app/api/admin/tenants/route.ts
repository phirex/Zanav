import { createAdminHandlerWithAuth } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createAdminHandlerWithAuth(async ({ client }) => {
  const { data: tenants, error } = await client
    .from("Tenant")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching tenants:", error);
    return { error: "Failed to fetch tenants" };
  }

  return { tenants };
});

export const POST = createAdminHandlerWithAuth(async ({ client, body }) => {
  const { name, subdomain } = body;

  if (!name) {
    return { error: "Tenant name is required" };
  }

  const { data: tenant, error } = await client
    .from("Tenant")
    .insert([
      {
        name,
        subdomain: subdomain || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating tenant:", error);
    return { error: "Failed to create tenant" };
  }

  return { tenant };
});
