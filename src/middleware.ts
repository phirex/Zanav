import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { DEFAULT_TENANT_ID, getTenantId } from "./lib/tenant";

export async function middleware(request: NextRequest) {
  const { pathname: currentPath } = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const subdomain = hostname.split(".")[0];

  console.log(`[Middleware] Hostname: ${hostname} Subdomain: ${subdomain} Path: ${currentPath}`);

  // Skip middleware for static files and API routes
  if (
    currentPath.startsWith("/_next") ||
    currentPath.startsWith("/api") ||
    currentPath.startsWith("/static") ||
    currentPath.includes(".")
  ) {
    return NextResponse.next();
  }

  // Handle kennel subdomain routing
  if (subdomain !== "www" && subdomain !== "zanav") {
    console.log(`[Middleware] Kennel subdomain detected: ${subdomain}`);
    
    // Check if this is a valid kennel subdomain
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      const { data: tenant } = await adminClient
        .from("Tenant")
        .select("id, name, subdomain")
        .eq("subdomain", subdomain)
        .single();

      if (tenant) {
        console.log(`[Middleware] Valid kennel subdomain: ${tenant.name}`);
        // Rewrite to kennel page
        const url = request.nextUrl.clone();
        url.pathname = `/kennel/${subdomain}`;
        return NextResponse.rewrite(url);
      } else {
        console.log(`[Middleware] Invalid kennel subdomain: ${subdomain}`);
        // Redirect to 404
        return NextResponse.redirect(new URL("/not-found", request.url));
      }
    } catch (error) {
      console.error(`[Middleware] Error checking kennel subdomain:`, error);
      return NextResponse.redirect(new URL("/not-found", request.url));
    }
  }

  // For www.zanav.io, handle authentication and tenant assignment
  if (subdomain === "www" || subdomain === "zanav") {
    console.log("[Middleware] Main domain detected, checking authentication...");
    
    // Create Supabase client
    let supabaseClient;
    try {
      const { createClient } = await import("@supabase/supabase-js");
      supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      console.log("[Middleware] Supabase client created successfully");
    } catch (error) {
      console.error("[Middleware] Error creating Supabase client:", error);
      return NextResponse.next();
    }

    // Get auth token from cookies
    const authCookie = request.cookies.get("sb-nlpsmauwwlnblgwtawbs-auth-token");
    console.log("[Middleware] Getting cookie sb-nlpsmauwwlnblgwtawbs-auth-token:", !!authCookie);

    if (!authCookie) {
      console.log("[Middleware] No auth cookie found");
      // Check other auth cookie variations
      for (let i = 0; i < 5; i++) {
        const cookieName = `sb-nlpsmauwwlnblgwtawbs-auth-token${i === 0 ? "" : `.${i}`}`;
        const cookie = request.cookies.get(cookieName);
        console.log(`[Middleware] Getting cookie ${cookieName}:`, !!cookie);
        if (cookie) {
          console.log(`[Middleware] Found auth cookie: ${cookieName}`);
          break;
        }
      }
    }

    // Try to get user from auth token
    let user = null;
    let tenantId = null;

    try {
      if (authCookie) {
        const { data: { user: authUser }, error } = await supabaseClient.auth.getUser(authCookie.value);
        if (error) {
          console.error("[Middleware] Error getting user from token:", error);
        } else if (authUser) {
          user = authUser;
          console.log("[Middleware] User result:", {
            hasUser: true,
            userId: user.id,
            userEmail: user.email,
            error: undefined
          });
        }
      }
    } catch (error) {
      console.error("[Middleware] Error in auth check:", error);
    }

    // If no user found, check all cookies
    if (!user) {
      console.log("[Middleware] User result:", {
        hasUser: false,
        userId: undefined,
        userEmail: undefined,
        error: "Auth session missing!"
      });

      // Check all cookies for debugging
      const allCookies = request.cookies.getAll();
      console.log("[Middleware] All cookies:", allCookies);

      // Allow access to public pages
      if (
        currentPath === "/" ||
        currentPath === "/login" ||
        currentPath === "/signup" ||
        currentPath === "/landing" ||
        currentPath.startsWith("/kennel/")
      ) {
        console.log("[Middleware] Public path, allowing access");
        return NextResponse.next();
      }

      // Redirect to login for protected pages
      console.log("[Middleware] Protected path, redirecting to login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // User is authenticated, check if they have a tenant
    if (user) {
      try {
        console.log("[Middleware] Checking user's tenant...");
        
        // Get user record from database
        const { data: userRecord } = await supabaseClient
          .from("User")
          .select("id, tenantId")
          .eq("supabaseUserId", user.id)
          .single();

        if (userRecord) {
          // Check how many kennels the user has access to
          const { data: userTenants } = await supabaseClient
            .from("UserTenant")
            .select("tenant_id")
            .eq("user_id", userRecord.id);

          if (userTenants && userTenants.length > 0) {
            // User has kennels - auto-assign to the first one
            tenantId = userTenants[0].tenant_id;
            console.log(`[Middleware] User has ${userTenants.length} kennel(s), auto-assigning to: ${tenantId}`);
            
            // Update user's tenantId if it's different
            if (userRecord.tenantId !== tenantId) {
              await supabaseClient
                .from("User")
                .update({ tenantId })
                .eq("id", userRecord.id);
              console.log(`[Middleware] Updated user's tenantId to: ${tenantId}`);
            }
          } else {
            console.log("[Middleware] User has no kennels");
          }
        }
      } catch (error) {
        console.error("[Middleware] Error checking user tenant:", error);
      }

      // Always continue for authenticated users, with or without tenant
      const response = NextResponse.next();
      
      // Set tenant cookie if we have one
      if (tenantId) {
        response.cookies.set("tenantId", tenantId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        console.log(`[Middleware] Set tenantId cookie: ${tenantId}`);
      }
      
      return response;
    }
  }

  // If we get here, either no user or no subdomain match
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (Supabase auth routes)
     * - api/webhooks (webhook routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks).*)",
  ],
};
