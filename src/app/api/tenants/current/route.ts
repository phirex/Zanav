import { createHandler } from "@/lib/apiHandler";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // Check if this is a kennel website request
  const hostname = request.headers.get("host") || "";
  const isKennelWebsite = hostname !== "www.zanav.io" && hostname !== "zanav.io" && !hostname.startsWith("www.");
  
  if (isKennelWebsite) {
    // This is a kennel website request - allow public access
    // Return basic tenant info without requiring authentication
    const subdomain = hostname.split('.')[0];
    
    // You can return basic kennel info here if needed
    return Response.json({
      subdomain: subdomain,
      isPublic: true,
      message: "Public kennel website access"
    });
  }
  
  // For main domain requests, use the normal authenticated handler
  return createHandler(async ({ client, tenantId }) => {
    // Get current user's tenant
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      return { error: "User not authenticated" };
    }

    // Get user record
    const { data: userRecord, error: userError } = await client
      .from("User")
      .select("id, tenantId")
      .eq("supabaseUserId", user.id)
      .single();

    if (userError || !userRecord) {
      return { error: "User record not found" };
    }

    // Get tenant details
    if (userRecord.tenantId) {
      const { data: tenant, error: tenantError } = await client
        .from("Tenant")
        .select("id, name, subdomain")
        .eq("id", userRecord.tenantId)
        .single();

      if (tenantError) {
        return { error: "Tenant not found" };
      }

      return {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        role: "OWNER" // Default role for main domain users
      };
    }

    return { error: "No tenant assigned" };
  })(request);
}

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
