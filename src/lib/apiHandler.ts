import { NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Force all API routes using this handler to be dynamic
export const dynamic = 'force-dynamic';

interface HandlerContext {
  req: Request;
  client: SupabaseClient<Database>;
  tenantId: string | null;
  body?: any;
  params?: Record<string, string | string[]>;
}

export type ApiHandler = (ctx: HandlerContext) => Promise<Response | any>;

export class ApiError extends Error {
  code: string;
  details?: any;
  constructor(code: string, message: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

/**
 * createHandler wraps an async function with:
 *  • Supabase SSR client instantiation (with auth session from cookies)
 *  • Tenant-context RPC (if `x-tenant-id` header present)
 *  • JSON body parsing for non-GET requests
 *  • Consistent error → JSON response mapping
 */
export function createHandler(handler: ApiHandler) {
  return async function (
    req: Request,
    params?: Record<string, any>,
  ): Promise<Response> {
    // Reduced logging - only log for errors or important events

    try {
      // Use SSR client that can read auth session from cookies
      const client = await createServerSupabaseClient();

      // 1. Header sent by any legacy / server-side call
      let tenantId: string | null = req.headers.get("x-tenant-id");

      // 2. If no header, derive from authenticated user ↔ UserTenant
      if (!tenantId) {
        try {
          const {
            data: { session },
          } = await client.auth.getSession();

          const supabaseUid = session?.user?.id;
          if (supabaseUid) {
            console.log("[API_HANDLER] Looking up tenant for user:", supabaseUid);
            
            // First, get the User record ID using the supabaseUserId
            const { data: userRecord, error: userError } = await client
              .from("User")
              .select("id, tenantId")
              .eq("supabaseUserId", supabaseUid)
              .single();

            if (!userError && userRecord) {
              console.log("[API_HANDLER] Found user record:", userRecord.id);
              
              // First try to use the user's tenantId if it's set
              if (userRecord.tenantId) {
                tenantId = userRecord.tenantId;
                console.log("[API_HANDLER] Using user's tenantId:", tenantId);
              } else {
                // Fallback: check if the User.id is linked to any tenant
                const { data: link } = await client
                  .from("UserTenant")
                  .select("tenant_id")
                  .eq("user_id", userRecord.id)
                  .maybeSingle();

                if (link?.tenant_id) {
                  tenantId = link.tenant_id;
                  console.log("[API_HANDLER] Found tenant from UserTenant:", tenantId);
                  
                  // Update the user's tenantId for future requests
                  await client
                    .from("User")
                    .update({ tenantId })
                    .eq("id", userRecord.id);
                  console.log("[API_HANDLER] Updated user's tenantId to:", tenantId);
                }
              }
            } else {
              console.error("[API_HANDLER] User record not found:", userError);
            }
          }
        } catch (lookupErr) {
          console.error("[API_HANDLER] tenant lookup failed", lookupErr);
        }
      }

      // Remove set_tenant RPC call; rely on explicit tenantId filtering in queries
      // if (tenantId) {
      //   try {
      //     await client.rpc("set_tenant", { _tenant_id: tenantId });
      //   } catch (rpcErr) {
      //     console.error("[API_HANDLER] set_tenant RPC failed", rpcErr);
      //   }
      // }

      // Parse JSON body for non-GET / non-HEAD
      let body: any = undefined;
      if (req.method !== "GET" && req.method !== "HEAD") {
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          try {
            body = await req.json();
          } catch (e) {
            console.error("[API_HANDLER] Failed to parse JSON body", e);
            return NextResponse.json(
              { error: "Invalid JSON body" },
              { status: 400 },
            );
          }
        }
      }

      const result = await handler({ req, client, tenantId, body, params });

      // If handler already returned a Response
      if (result instanceof Response) return result;

      // Check if the result contains an error and return appropriate status code
      if (result && typeof result === 'object' && 'error' in result) {
        return NextResponse.json(result, { status: 400 });
      }

      // Otherwise serialize to JSON with 200 status
      return NextResponse.json(result ?? {}, { status: 200 });
    } catch (err: any) {
      console.error("[API_HANDLER] Error caught:", err);
      console.error("[API_HANDLER] Error message:", err?.message);
      console.error("[API_HANDLER] Error stack:", err?.stack);
      if (err instanceof ApiError) {
        return NextResponse.json(
          {
            error: {
              code: err.code,
              message: err.message,
              details: err.details,
            },
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        {
          error: {
            code: "internal_server_error",
            message: err?.message || "Internal Server Error",
            details: err?.stack,
          },
        },
        { status: 500 },
      );
    }
  };
}

export function createAdminHandler(handler: ApiHandler) {
  return async function (
    req: Request,
    params?: Record<string, any>,
  ): Promise<Response> {
    try {
      console.log("[ADMIN_HANDLER] Request method:", req.method);
      console.log("[ADMIN_HANDLER] Request URL:", req.url);
      console.log("[ADMIN_HANDLER] Params received:", params);
      
      const client = supabaseAdmin();

      // Get tenant ID from headers
      const tenantId = req.headers.get("x-tenant-id") || null;
      console.log("[ADMIN_HANDLER] Tenant ID from headers:", tenantId);

      // Parse JSON body for non-GET / non-HEAD
      let body: any = undefined;
      if (req.method !== "GET" && req.method !== "HEAD") {
        const contentType = req.headers.get("content-type") || "";
        console.log("[ADMIN_HANDLER] Content-Type:", contentType);
        if (contentType.includes("application/json")) {
          try {
            body = await req.json();
            console.log("[ADMIN_HANDLER] Body parsed:", body);
          } catch (e) {
            console.log("[ADMIN_HANDLER] Failed to parse body:", e);
            return NextResponse.json(
              { error: "Invalid JSON body" },
              { status: 400 },
            );
          }
        }
      }

      console.log("[ADMIN_HANDLER] Calling handler with params:", { req: "Request object", client: "Supabase client", tenantId, body, params });
      const result = await handler({ req, client, tenantId, body, params });
      console.log("[ADMIN_HANDLER] Handler result:", result);
      
      if (result instanceof Response) return result;
      
      // Check if the result contains an error and return appropriate status code
      if (result && typeof result === 'object' && 'error' in result) {
        console.log("[ADMIN_HANDLER] Returning error result:", result);
        return NextResponse.json(result, { status: 400 });
      }
      
      return NextResponse.json(result ?? {}, { status: 200 });
    } catch (err: any) {
      console.error("[ADMIN_HANDLER] Error caught:", err);
      return NextResponse.json(
        { error: err?.message || "Internal Server Error" },
        { status: 500 },
      );
    }
  };
}
