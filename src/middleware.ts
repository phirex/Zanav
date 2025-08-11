import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { DEFAULT_TENANT_ID, getTenantId } from "./lib/tenant";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // Check for static files and images first
    const currentPath = request.nextUrl.pathname;
    if (
      currentPath.startsWith("/images/") ||
      currentPath.startsWith("/_next/") ||
      currentPath.startsWith("/assets/") ||
      currentPath.endsWith(".svg") ||
      currentPath.endsWith(".png") ||
      currentPath.endsWith(".jpg") ||
      currentPath.endsWith(".jpeg")
    ) {
      return NextResponse.next();
    }

    // Handle subdomain routing for kennel websites
    const hostname = request.headers.get("host") || "";
    const subdomain = hostname.split(".")[0];
    
    console.log("[Middleware] Hostname:", hostname, "Subdomain:", subdomain, "Path:", currentPath);
    
    // If this is a subdomain (not www, not the main domain), route to kennel page
    if (subdomain && subdomain !== "www" && subdomain !== "zanav" && !hostname.includes("localhost")) {
      // Don't rewrite API routes - let them pass through normally
      if (currentPath.startsWith("/api/")) {
        console.log("[Middleware] API route detected, skipping rewrite");
        return response;
      }
      
      // Check if the path is not already a kennel path
      if (!currentPath.startsWith("/kennel/")) {
        const kennelUrl = new URL(`/kennel/${subdomain}${currentPath}`, request.url);
        console.log("[Middleware] Rewriting to:", kennelUrl.toString());
        return NextResponse.rewrite(kennelUrl);
      }
    }

    // Create supabase client configured for middleware
    let supabase;
    try {
      console.log("[Middleware] Creating Supabase client...");
      supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              const cookie = request.cookies.get(name);
              const hasValue = !!cookie?.value;
              console.log(`[Middleware] Getting cookie ${name}:`, hasValue);
              return cookie?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              console.log(`[Middleware] Setting cookie ${name}:`, !!value);
              response.cookies.set({
                name,
                value,
                ...options,
              });
            },
            remove(name: string, options: CookieOptions) {
              console.log(`[Middleware] Removing cookie ${name}`);
              response.cookies.delete({
                name,
                ...options,
              });
            },
          },
        },
      );
      console.log("[Middleware] Supabase client created successfully");
    } catch (supabaseError) {
      console.error(
        "[Middleware] Error creating supabase client:",
        supabaseError,
      );
      return response;
    }

    // Get current user
    console.log("[Middleware] About to get user from Supabase...");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("[Middleware] User error:", userError.message);
    }

    console.log("[Middleware] User result:", {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      error: userError?.message
    });

    // DEBUG: Log all cookies and user info
    console.log("[Middleware] All cookies:", Array.from(request.cookies.getAll()));
    console.log("[Middleware] User from Supabase:", user ? { id: user.id, email: user.email } : "null");
    console.log("[Middleware] Current path:", currentPath);

                    // --- Public Path Logic ---
                const publicPaths = [
                  "/api/auth",
                  "/api/signup", // Allow signup API endpoint
                  "/api/kennel-website/public", // Allow public kennel website API
                  "/api/tenants/by-subdomain", // Allow tenant lookup by subdomain
                  "/kennel", // Allow public kennel websites
                  "/login",
                  "/register",
                  "/signup",
                  "/forgot-password",
                  "/reset-password",
                  "/landing",
                  "/auth/callback", // Allow OAuth callback route
                  "/favicon.ico",
                  "/_next",
                  "/assets",
                  "/images",
                  "/api/webhooks",
                ];

    // If this is a subdomain request, treat it as a public path
    if (subdomain && subdomain !== "www" && subdomain !== "zanav" && !hostname.includes("localhost")) {
      return response;
    }

    // Check if the current path is a public path that doesn't require authentication
    const isPublicPath = publicPaths.some((path) =>
      currentPath.startsWith(path),
    );

    // If user is logged in and trying to access login/register/landing pages, redirect to home
    if (
      user &&
      (currentPath === "/login" ||
        currentPath === "/register" ||
        currentPath === "/landing")
    ) {
      console.log("[Middleware] Authenticated user accessing auth page, redirecting to /");
      return NextResponse.redirect(new URL("/", request.url));
    }

    // If it's a public path, allow access
    if (isPublicPath) {
      console.log("[Middleware] Public path, allowing access");
      return response;
    }

    // Special case: if not authenticated and trying root path, send to landing page
    if (!user && (currentPath === "/" || currentPath === "")) {
      // Check if this is an OAuth callback (has code parameter)
      const url = new URL(request.url);
      const code = url.searchParams.get("code");
      
      if (code) {
        console.log("[Middleware] OAuth code detected at root, redirecting to /auth/callback");
        // Redirect OAuth callback to our proper callback route
        return NextResponse.redirect(new URL(`/auth/callback?code=${code}`, request.url));
      }
      
      console.log("[Middleware] No user, redirecting root path to /landing");
      return NextResponse.redirect(new URL("/landing", request.url));
    }

    // --- Auth Check for Non-Public Paths ---
    if (!user) {
      console.log("[Middleware] No user found, redirecting to login");
      // Check for potential redirect loops
      if (request.cookies.has("redirect_count")) {
        const redirectCount = parseInt(
          request.cookies.get("redirect_count")?.value || "0",
        );
        if (redirectCount > 2) {
          console.error(
            "[Middleware] Detected redirect loop, clearing cookies",
          );
          // Return response with cleared auth cookies to break the loop
          const resetResponse = NextResponse.redirect(
            new URL("/login", request.url),
          );
          resetResponse.cookies.delete("supabase-auth-token");
          resetResponse.cookies.delete("redirect_count");
          return resetResponse;
        }

        // Increment redirect count
        response.cookies.set("redirect_count", (redirectCount + 1).toString(), {
          maxAge: 60, // 1 minute expiry
          path: "/",
        });
      } else {
        // Set initial redirect count
        response.cookies.set("redirect_count", "1", {
          maxAge: 60, // 1 minute expiry
          path: "/",
        });
      }

      // Store the original URL to redirect back after login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Clear redirect count if we have a valid session
    if (user && request.cookies.has("redirect_count")) {
      response.cookies.delete("redirect_count");
    }

    // --- Tenant Logic for Authenticated Users ---
    let tenantId = DEFAULT_TENANT_ID;
    try {
      tenantId = await getTenantId(request as unknown as Request);
    } catch (tenantError) {
      console.error(
        "[Middleware] Error getting tenant ID, using default:",
        tenantError,
      );
      tenantId = DEFAULT_TENANT_ID;
    }

    // NEW: Check if user has multiple kennels and redirect if needed
    if (user && (currentPath === "/" || currentPath === "/dashboard")) {
      try {
        console.log("[Middleware] Checking for multiple kennels...");
        
        // Create admin client to check user tenants
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

        // Get user's current tenant selection
        const { data: userRecord } = await adminClient
          .from("User")
          .select("id, tenantId")
          .eq("supabaseUserId", user.id)
          .single();

        if (userRecord) {
          // Check if user has already selected a valid tenant
          if (userRecord.tenantId && userRecord.tenantId !== DEFAULT_TENANT_ID) {
            console.log(`[Middleware] User has already selected tenant: ${userRecord.tenantId}`);
            tenantId = userRecord.tenantId;
          } else {
            // User hasn't selected a tenant yet, check how many they have access to
            const { data: userTenants } = await adminClient
              .from("UserTenant")
              .select("tenant_id")
              .eq("user_id", userRecord.id);

            if (userTenants && userTenants.length > 1) {
              console.log(`[Middleware] User has ${userTenants.length} kennels but no selection, redirecting to selection`);
              return NextResponse.redirect(new URL("/select-tenant", request.url));
            } else if (userTenants && userTenants.length === 1) {
              // User has exactly one kennel, automatically set it
              tenantId = userTenants[0].tenant_id;
              console.log(`[Middleware] User has 1 kennel, auto-setting tenant ID: ${tenantId}`);
            }
          }
        }
      } catch (error) {
        console.error("[Middleware] Error checking user tenants:", error);
        // Continue with default behavior if check fails
      }
    }

    // Prevent redirect loops: if user is on select-tenant page and has a valid tenant, don't redirect
    if (user && currentPath === "/select-tenant") {
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

        const { data: userRecord } = await adminClient
          .from("User")
          .select("id, tenantId")
          .eq("supabaseUserId", user.id)
          .single();

        if (userRecord && userRecord.tenantId && userRecord.tenantId !== DEFAULT_TENANT_ID) {
          console.log(`[Middleware] User on select-tenant page but already has tenant: ${userRecord.tenantId}, redirecting to dashboard`);
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      } catch (error) {
        console.error("[Middleware] Error checking user tenant on select-tenant page:", error);
      }
    }

    // --- Set tenant/user headers for server components ---
    const newHeaders = new Headers(request.headers);
    newHeaders.set("x-tenant-id", tenantId);
    if (user) {
      newHeaders.set("x-user-id", user.id);
    } else {
      newHeaders.set("x-user-id", "");
    }

    // Create the final response with the added headers
    response = NextResponse.next({
      request: {
        headers: newHeaders,
      },
    });

    // --- Set tenantId cookie for CLIENT-SIDE access ---
    response.cookies.set("tenantId", tenantId, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error("[Middleware] Error in middleware:", error);
    return response;
  }
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
