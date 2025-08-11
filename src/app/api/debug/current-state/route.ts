import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createHandler(async ({ client }) => {
  try {
    const state: any = {
      timestamp: new Date().toISOString(),
      session: null,
      userRecord: null,
      tenant: null,
      cookies: {},
      errors: []
    };

    // Get current session
    try {
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      if (sessionError) {
        state.errors.push(`Session error: ${sessionError.message}`);
      } else if (session?.user) {
        state.session = {
          id: session.user.id,
          email: session.user.email,
          provider: session.user.app_metadata?.provider
        };
      }
    } catch (e) {
      state.errors.push(`Session exception: ${e}`);
    }

    // If we have a session, check database state
    if (state.session) {
      try {
        const adminSupabase = supabaseAdmin();
        
        // Check if user exists in database
        const { data: userRecord, error: userError } = await adminSupabase
          .from("User")
          .select("*")
          .eq("supabaseUserId", state.session.id)
          .maybeSingle();

        if (userError) {
          state.errors.push(`User lookup error: ${userError.message}`);
        } else if (userRecord) {
          state.userRecord = {
            id: userRecord.id,
            email: userRecord.email,
            tenantId: userRecord.tenantId,
            name: userRecord.name
          };

          // Check tenant if user has one
          if (userRecord.tenantId) {
            const { data: tenant, error: tenantError } = await adminSupabase
              .from("Tenant")
              .select("*")
              .eq("id", userRecord.tenantId)
              .maybeSingle();

            if (tenantError) {
              state.errors.push(`Tenant lookup error: ${tenantError.message}`);
            } else if (tenant) {
              state.tenant = {
                id: tenant.id,
                name: tenant.name,
                subdomain: tenant.subdomain
              };
            }
          }
        }
      } catch (e) {
        state.errors.push(`Database check exception: ${e}`);
      }
    }

    // Get cookies from request
    try {
      state.cookies = { authSession: 'Available' };
    } catch (e) {
      state.errors.push(`Cookie check exception: ${e}`);
    }

    return state;

  } catch (error) {
    return {
      error: "Exception in current state check",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    };
  }
}); 