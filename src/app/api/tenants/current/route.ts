import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createHandler(async ({ req, tenantId }) => {
  if (!tenantId) {
    return { error: "No tenant context found" };
  }

  try {
    // Use admin client to bypass RLS and get tenant info
    const { data, error } = await supabaseAdmin()
      .from("Tenant")
      .select("id, name, subdomain")
      .eq("id", tenantId)
      .single();

    if (error) {
      console.error("[TENANTS/CURRENT] Error fetching tenant:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("[TENANTS/CURRENT] Error:", error);
    throw error;
  }
});

export const PATCH = createHandler(async ({ req, tenantId, body }) => {
  if (!tenantId) {
    return { error: "No tenant context found" };
  }

  try {
    // Use admin client to bypass RLS and update tenant info
    const { data, error } = await supabaseAdmin()
      .from("Tenant")
      .update(body)
      .eq("id", tenantId)
      .select("id, name, subdomain")
      .single();

    if (error) {
      console.error("[TENANTS/CURRENT] Error updating tenant:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("[TENANTS/CURRENT] Error:", error);
    throw error;
  }
});
