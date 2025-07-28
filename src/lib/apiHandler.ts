import { NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

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
            // First, get the User record ID using the supabaseUserId
            const { data: userRecord, error: userError } = await client
              .from("User")
              .select("id")
              .eq("supabaseUserId", supabaseUid)
              .single();

            if (!userError && userRecord) {
              // Now check if the User.id is linked to any tenant
              const { data: link } = await client
                .from("UserTenant")
                .select("tenant_id")
                .eq("user_id", userRecord.id)
                .maybeSingle();

              tenantId = link?.tenant_id ?? null;
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

      // Otherwise serialize to JSON
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
      const client = supabaseAdmin();

      // (Optional) tenant context — rarely needed in admin context but kept for consistency
      const tenantId = req.headers.get("x-tenant-id") || null;
      if (tenantId) {
        try {
          await client.rpc("set_tenant", { _tenant_id: tenantId });
        } catch (e) {
          console.error("[createAdminHandler] failed to set tenant context", e);
        }
      }

      // Parse JSON body for non-GET / non-HEAD
      let body: any = undefined;
      if (req.method !== "GET" && req.method !== "HEAD") {
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          try {
            body = await req.json();
          } catch (e) {
            return NextResponse.json(
              { error: "Invalid JSON body" },
              { status: 400 },
            );
          }
        }
      }

      const result = await handler({ req, client, tenantId, body, params });
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? {}, { status: 200 });
    } catch (err: any) {
      console.error("Admin API Handler Error", err);
      return NextResponse.json(
        { error: err?.message || "Internal Server Error" },
        { status: 500 },
      );
    }
  };
}
