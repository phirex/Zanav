import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { DEFAULT_TENANT_ID, getTenantId } from "./lib/tenant";

export async function middleware(request: NextRequest) {
  const { pathname: currentPath, hostname } = request.nextUrl;
  const isApiRoute = currentPath.startsWith("/api/");

  // Skip middleware for static files and assets
  if (
    currentPath.startsWith("/_next") ||
    currentPath.startsWith("/static") ||
    currentPath.includes(".") ||
    currentPath.startsWith("/images/") ||
    currentPath.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Handle kennel subdomains FIRST with explicit rewrite to public site
  if (hostname !== "www.zanav.io" && hostname !== "zanav.io") {
    const subdomain = hostname.split(".")[0];

    // Allow public kennel APIs to pass through
    if (isApiRoute) {
      if (currentPath.startsWith(`/api/kennel-website/public/`)) {
        return NextResponse.next();
      }
      // Everything else under kennel subdomain API should be public-safe by default
      // but explicitly block private app APIs like /api/bookings
      if (currentPath.startsWith("/api/bookings")) {
        return NextResponse.json({ error: "Not available on public kennel site" }, { status: 404 });
      }
      return NextResponse.next();
    }

    // Rewrite kennel root and any non-/kennel path to the public kennel page
    if (!currentPath.startsWith("/kennel/")) {
      const url = request.nextUrl.clone();
      url.pathname = `/kennel/${subdomain}`;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  // Skip middleware for public pages entirely (main domain)
  if (
    currentPath === "/" ||
    currentPath === "/login" ||
    currentPath === "/signup" ||
    currentPath === "/landing" ||
    currentPath.startsWith("/kennel/")
  ) {
    return NextResponse.next();
  }

  // Main domain logic - only for protected routes
  if (hostname === "www.zanav.io" || hostname === "zanav.io") {
    // Skip API routes entirely for now to avoid breaking them
    if (isApiRoute) {
      return NextResponse.next();
    }

    // Check for auth cookies
    const base = "sb-nlpsmauwwlnblgwtawbs-auth-token";
    const authCookie = request.cookies.get(base);
    const authCookie0 = request.cookies.get(`${base}.0`);
    const authCookie1 = request.cookies.get(`${base}.1`);
    const authCookie2 = request.cookies.get(`${base}.2`);
    const authCookie3 = request.cookies.get(`${base}.3`);
    const authCookie4 = request.cookies.get(`${base}.4`);

    // Find the first available auth cookie
    let foundAuthCookie = authCookie || authCookie4 || authCookie3 || authCookie2 || authCookie1 || authCookie0;

    // If no auth cookie found, redirect to landing page for unauthenticated users
    if (!foundAuthCookie) {
      return NextResponse.redirect(new URL("/landing", request.url));
    }

    // User has auth cookie, try to authenticate them
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Try to get user from auth token
    let user = null;

    if (foundAuthCookie) {
      // Try to parse the JWT token normally first
      const { data: { user: authUser }, error } = await supabaseClient.auth.getUser(foundAuthCookie.value);
      
      if (error) {
        // If JWT parsing fails, try to extract user ID from the corrupted token
        if (error.message.includes("token is malformed") || error.message.includes("invalid JWT")) {
          try {
            // The token might be partially readable - try to extract what we can
            const tokenParts = foundAuthCookie.value.split('.');
            
            if (tokenParts.length >= 2) {
              // Try to decode the payload part (second part)
              try {
                const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
                
                if (payload.sub) {
                  // Instead of using admin client, try to verify user exists by checking the database
                  const { data: userRecord, error: userError } = await supabaseClient
                    .from("User")
                    .select("id, email, tenantId")
                    .eq("supabaseUserId", payload.sub)
                    .single();
                  
                  if (!userError && userRecord) {
                    // Create a mock user object with the extracted data
                    user = {
                      id: payload.sub,
                      email: userRecord.email,
                      user_metadata: { email: userRecord.email }
                    };
                  }
                }
              } catch {}
            }
          } catch {}
        }
      } else if (authUser) {
        user = authUser;
      }
    }

    // If no user found, redirect to landing
    if (!user) {
      return NextResponse.redirect(new URL("/landing", request.url));
    }

    // User is authenticated, check if they have a tenant
    if (user) {
      try {
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
            const tenantId = userTenants[0].tenant_id;
            
            // Update user's tenantId if it's different
            if (userRecord.tenantId !== tenantId) {
              await supabaseClient
                .from("User")
                .update({ tenantId })
                .eq("id", userRecord.id);
            }

            // Set tenant cookie and continue
            const response = NextResponse.next();
            response.cookies.set("tenantId", tenantId, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7, // 7 days
            });
            return response;
          }
        }
      } catch {}
    }

    // User is authenticated - allow access to all pages
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks).*)",
  ],
};
