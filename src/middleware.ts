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
    currentPath.startsWith("/static") ||
    currentPath.includes(".")
  ) {
    return NextResponse.next();
  }

  // For API routes, just pass through but don't skip entirely
  const isApiRoute = currentPath.startsWith("/api");
  
  // TEMPORARILY: Allow admin routes to pass through without middleware interference
  if (currentPath.startsWith("/admin")) {
    console.log("[Middleware] Admin route detected, allowing access without middleware checks");
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

  // For www.zanav.io, handle basic authentication only
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

    let foundAuthCookie = authCookie;

    if (!authCookie) {
      console.log("[Middleware] No auth cookie found");
      // Check other auth cookie variations
      for (let i = 0; i < 5; i++) {
        const cookieName = `sb-nlpsmauwwlnblgwtawbs-auth-token${i === 0 ? "" : `.${i}`}`;
        const cookie = request.cookies.get(cookieName);
        console.log(`[Middleware] Getting cookie ${cookieName}:`, !!cookie);
        if (cookie) {
          console.log(`[Middleware] Found auth cookie: ${cookieName}`);
          foundAuthCookie = cookie;
          break;
        }
      }
    }

    // Try to get user from auth token
    let user = null;

    try {
      if (foundAuthCookie) {
        // Try to parse the JWT token normally first
        try {
          const { data: { user: authUser }, error } = await supabaseClient.auth.getUser(foundAuthCookie.value);
          if (error) {
            console.error("[Middleware] Error getting user from token:", error);
            
            // If JWT parsing fails, try to extract user ID from the corrupted token
            if (error.message.includes("token is malformed") || error.message.includes("invalid JWT")) {
              console.log("[Middleware] JWT corrupted, attempting to extract user ID from token...");
              
              // Try to extract user ID from the corrupted token
              try {
                // The token might be partially readable - try to extract what we can
                const tokenParts = foundAuthCookie.value.split('.');
                if (tokenParts.length >= 2) {
                  // Try to decode the payload part (second part)
                  const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
                  if (payload.sub) {
                    console.log("[Middleware] Successfully extracted user ID from corrupted JWT:", payload.sub);
                    
                    // Verify this user exists using admin client
                    const { data: { user: adminUser }, error: adminError } = await supabaseClient.auth.admin.getUserById(payload.sub);
                    if (!adminError && adminUser) {
                      user = adminUser;
                      console.log("[Middleware] User verified via admin client:", user.email);
                    }
                  }
                }
              } catch (extractError) {
                console.error("[Middleware] Failed to extract user ID from corrupted JWT:", extractError);
              }
            }
          } else if (authUser) {
            user = authUser;
            console.log("[Middleware] User result:", {
              hasUser: true,
              userId: user.id,
              userEmail: user.email,
              error: undefined
            });
          }
        } catch (parseError) {
          console.error("[Middleware] JWT parsing completely failed:", parseError);
        }
      }
    } catch (error) {
      console.error("[Middleware] Error in auth check:", error);
    }

    // If no user found, allow access to public pages only
    if (!user) {
      console.log("[Middleware] User result:", {
        hasUser: false,
        userId: undefined,
        userEmail: undefined,
        error: "Auth session missing!"
      });

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

      // For API routes, just pass through without redirecting
      if (isApiRoute) {
        console.log("[Middleware] API route, passing through without auth check");
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
        console.log("[Middleware] User ID:", user.id);
        console.log("[Middleware] User email:", user.email);
        
        // Get user record from database
        const { data: userRecord, error: userError } = await supabaseClient
          .from("User")
          .select("id, tenantId")
          .eq("supabaseUserId", user.id)
          .single();

        if (userError) {
          console.error("[Middleware] Error fetching user record:", userError);
        }

        if (userRecord) {
          console.log("[Middleware] User record found:", userRecord);
          
          // Check how many kennels the user has access to
          const { data: userTenants, error: userTenantsError } = await supabaseClient
            .from("UserTenant")
            .select("tenant_id")
            .eq("user_id", userRecord.id);

          if (userTenantsError) {
            console.error("[Middleware] Error fetching user tenants:", userTenantsError);
          }

          console.log("[Middleware] UserTenant records found:", userTenants);

          if (userTenants && userTenants.length > 0) {
            // User has kennels - auto-assign to the first one
            const tenantId = userTenants[0].tenant_id;
            console.log(`[Middleware] User has ${userTenants.length} kennel(s), auto-assigning to: ${tenantId}`);
            
            // Update user's tenantId if it's different
            if (userRecord.tenantId !== tenantId) {
              const { error: updateError } = await supabaseClient
                .from("User")
                .update({ tenantId })
                .eq("id", userRecord.id);
              
              if (updateError) {
                console.error("[Middleware] Error updating user tenantId:", updateError);
              } else {
                console.log(`[Middleware] Updated user's tenantId to: ${tenantId}`);
              }
            }

            // Set tenant cookie and continue
            const response = NextResponse.next();
            response.cookies.set("tenantId", tenantId, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7, // 7 days
            });
            console.log(`[Middleware] Set tenantId cookie: ${tenantId}`);
            return response;
          } else {
            console.log("[Middleware] User has no kennels");
          }
        } else {
          console.log("[Middleware] No user record found in database");
        }
      } catch (error) {
        console.error("[Middleware] Error checking user tenant:", error);
      }
    }

    // User is authenticated - allow access to all pages
    console.log("[Middleware] User authenticated, allowing access");
    return NextResponse.next();
  }

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
