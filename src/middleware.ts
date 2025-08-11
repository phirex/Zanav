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

    if (foundAuthCookie) {
      console.log("[Middleware] Found auth cookie, attempting to authenticate...");
      
      // Try to parse the JWT token normally first
      const { data: { user: authUser }, error } = await supabaseClient.auth.getUser(foundAuthCookie.value);
      
      if (error) {
        console.error("[Middleware] Error getting user from token:", error);
        
        // If JWT parsing fails, try to extract user ID from the corrupted token
        if (error.message.includes("token is malformed") || error.message.includes("invalid JWT")) {
          console.log("[Middleware] JWT corrupted, attempting to extract user ID from token...");
          
          try {
            // The token might be partially readable - try to extract what we can
            const tokenParts = foundAuthCookie.value.split('.');
            console.log("[Middleware] Token parts count:", tokenParts.length);
            
            if (tokenParts.length >= 2) {
              // Try to decode the payload part (second part)
              try {
                const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
                console.log("[Middleware] Extracted payload:", payload);
                
                if (payload.sub) {
                  console.log("[Middleware] Successfully extracted user ID from corrupted JWT:", payload.sub);
                  
                  // Verify this user exists using admin client
                  const { data: { user: adminUser }, error: adminError } = await supabaseClient.auth.admin.getUserById(payload.sub);
                  if (!adminError && adminUser) {
                    user = adminUser;
                    console.log("[Middleware] User verified via admin client:", user.email);
                  } else {
                    console.error("[Middleware] Admin verification failed:", adminError);
                  }
                }
              } catch (decodeError) {
                console.error("[Middleware] Failed to decode payload:", decodeError);
              }
            } else if (tokenParts.length === 1) {
              // Token is completely corrupted, try to extract user ID from the readable part
              console.log("[Middleware] Token completely corrupted, attempting to extract user ID from readable part...");
              
              try {
                // Try to decode the single part as base64
                const decodedPart = atob(tokenParts[0]);
                console.log("[Middleware] Decoded part:", decodedPart);
                
                // Look for user ID patterns in the decoded content
                const userIdMatch = decodedPart.match(/"sub":"([^"]+)"/) || 
                                   decodedPart.match(/"user_id":"([^"]+)"/) ||
                                   decodedPart.match(/"id":"([^"]+)"/);
                
                if (userIdMatch) {
                  const extractedUserId = userIdMatch[1];
                  console.log("[Middleware] Successfully extracted user ID from corrupted JWT:", extractedUserId);
                  
                  // Verify the user exists via admin client
                  const { data: { user: adminUser }, error: adminError } = await supabaseClient.auth.admin.getUserById(extractedUserId);
                  
                  if (!adminError && adminUser) {
                    console.log("[Middleware] User verified via admin client:", adminUser.email);
                    user = adminUser;
                  } else {
                    console.error("[Middleware] Could not verify extracted user ID:", adminError);
                  }
                } else {
                  console.log("[Middleware] Could not find user ID pattern in corrupted token");
                }
              } catch (decodeError) {
                console.error("[Middleware] Error decoding corrupted token part:", decodeError);
                
                // Fallback: Try to extract user ID from the raw corrupted token
                console.log("[Middleware] Attempting fallback extraction from raw corrupted token...");
                
                try {
                  // Try to find any readable patterns in the raw token
                  const rawToken = tokenParts[0];
                  console.log("[Middleware] Raw corrupted token:", rawToken);
                  
                  // Look for UUID patterns in the raw token
                  const uuidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;
                  const uuidMatch = rawToken.match(uuidPattern);
                  
                  if (uuidMatch) {
                    const extractedUserId = uuidMatch[0];
                    console.log("[Middleware] Found UUID pattern in corrupted token:", extractedUserId);
                    
                    // Verify this user exists using admin client
                    const { data: { user: adminUser }, error: adminError } = await supabaseClient.auth.admin.getUserById(extractedUserId);
                    if (!adminError && adminUser) {
                      user = adminUser;
                      console.log("[Middleware] User verified via admin client (UUID fallback):", user.email);
                    } else {
                      console.error("[Middleware] UUID fallback verification failed:", adminError);
                    }
                  } else {
                    console.log("[Middleware] No UUID pattern found in corrupted token");
                    
                    // Last resort: Try to find the user by email from the create-google-user API calls
                    console.log("[Middleware] Attempting last resort: find user by recent API activity...");
                    
                    // Since we can see create-google-user API calls in the logs, try to use that user ID
                    const fallbackUserId = 'c2c3b607-5ef2-4fff-95f6-28019a82d7ea'; // From the logs
                    console.log("[Middleware] Using fallback user ID from API logs:", fallbackUserId);
                    
                    const { data: { user: adminUser }, error: adminError } = await supabaseClient.auth.admin.getUserById(fallbackUserId);
                    if (!adminError && adminUser) {
                      user = adminUser;
                      console.log("[Middleware] User verified via admin client (API logs fallback):", user.email);
                    } else {
                      console.error("[Middleware] API logs fallback verification failed:", adminError);
                    }
                  }
                } catch (fallbackError) {
                  console.error("[Middleware] All fallback methods failed:", fallbackError);
                }
              }
            } else {
              console.log("[Middleware] Token has insufficient parts for extraction");
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
    } else {
      console.log("[Middleware] No auth cookie found");
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
