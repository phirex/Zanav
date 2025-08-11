import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createHandler(async ({ client }) => {
  try {
    // Get the current user session
    const {
      data: { session },
    } = await client.auth.getSession();

    if (!session?.user) {
      return {
        error: "No authenticated session found",
        session: null
      };
    }

    console.log("[DEBUG] User session found:", session.user.id, session.user.email);

    // Use admin client to check user status
    const adminSupabase = supabaseAdmin();

    // Check if user exists in our User table
    const { data: userRecord, error: userError } = await adminSupabase
      .from("User")
      .select("*")
      .eq("supabaseUserId", session.user.id)
      .maybeSingle();

    if (userError) {
      console.error("[DEBUG] Error fetching user record:", userError);
      return {
        error: "Failed to fetch user record",
        userError: userError.message,
        session: {
          id: session.user.id,
          email: session.user.email
        }
      };
    }

    if (!userRecord) {
      console.log("[DEBUG] No user record found for:", session.user.id);
      return {
        error: "No user record found in database",
        session: {
          id: session.user.id,
          email: session.user.email
        },
        userRecord: null
      };
    }

    console.log("[DEBUG] User record found:", userRecord.id, "tenant:", userRecord.tenantId);

    // Check UserTenant links
    const { data: userTenantLinks, error: linkError } = await adminSupabase
      .from("UserTenant")
      .select("*")
      .eq("user_id", userRecord.id);

    if (linkError) {
      console.error("[DEBUG] Error fetching user-tenant links:", linkError);
    }

    // Check if tenant exists
    let tenantData = null;
    if (userRecord.tenantId) {
      const { data: tenant, error: tenantError } = await adminSupabase
        .from("Tenant")
        .select("*")
        .eq("id", userRecord.tenantId)
        .maybeSingle();

      if (tenantError) {
        console.error("[DEBUG] Error fetching tenant:", tenantError);
      } else {
        tenantData = tenant;
      }
    }

    // Check if user has rooms
    let roomCount = 0;
    if (userRecord.tenantId) {
      const { count, error: roomError } = await adminSupabase
        .from("Room")
        .select("*", { count: "exact" })
        .eq("tenantId", userRecord.tenantId);

      if (roomError) {
        console.error("[DEBUG] Error counting rooms:", roomError);
      } else {
        roomCount = count || 0;
      }
    }

    return {
      success: true,
      session: {
        id: session.user.id,
        email: session.user.email
      },
      userRecord: {
        id: userRecord.id,
        email: userRecord.email,
        supabaseUserId: userRecord.supabaseUserId,
        tenantId: userRecord.tenantId,
        name: userRecord.name,
        firstName: userRecord.firstName,
        lastName: userRecord.lastName,
        createdAt: userRecord.createdAt,
        updatedAt: userRecord.updatedAt
      },
      userTenantLinks: userTenantLinks || [],
      tenant: tenantData,
      roomCount,
      shouldRedirectToKennelSetup: !userRecord.tenantId || roomCount === 0
    };

  } catch (error) {
    console.error("[DEBUG] Exception in user status check:", error);
    return {
      error: "Exception occurred",
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}); 