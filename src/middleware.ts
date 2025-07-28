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
    
    // If this is a subdomain (not www, not the main domain), route to kennel page
    if (subdomain && subdomain !== "www" && subdomain !== "zanav" && !hostname.includes("localhost")) {
      // Check if the path is not already a kennel path
      if (!currentPath.startsWith("/kennel/")) {
        const kennelUrl = new URL(`/kennel/${subdomain}${currentPath}`, request.url);
        return NextResponse.rewrite(kennelUrl);
      }
    }

    // Create supabase client configured for middleware
    let supabase;
    try {
      supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              const cookie = request.cookies.get(name);
              return cookie?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              response.cookies.set({
                name,
                value,
                ...options,
              });
            },
            remove(name: string, options: CookieOptions) {
              response.cookies.delete({
                name,
                ...options,
              });
            },
          },
        },
      );
    } catch (supabaseError) {
      console.error(
        "[Middleware] Error creating supabase client:",
        supabaseError,
      );
      return response;
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("[Middleware] User error:", userError.message);
    }

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
      return NextResponse.redirect(new URL("/", request.url));
    }

    // If it's a public path, allow access
    if (isPublicPath) {
      return response;
    }

    // Special case: if not authenticated and trying root path, send to landing page
    if (!user && (currentPath === "/" || currentPath === "")) {
      return NextResponse.redirect(new URL("/landing", request.url));
    }

    // --- Auth Check for Non-Public Paths ---
    if (!user) {
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
