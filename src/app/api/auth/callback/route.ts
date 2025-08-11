import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  console.log("[Auth Callback] Starting callback with code:", !!code, "next:", next);

  // Prepare redirect response
  let response = NextResponse.redirect(`${origin}${next}`);

  if (code) {
    const cookieStore = cookies();
    console.log("[Auth Callback] Cookie store available:", !!cookieStore);

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = cookieStore.get(name)?.value;
            console.log(`[Auth Callback] Getting cookie ${name}:`, !!value);
            return value;
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log(`[Auth Callback] Setting cookie ${name}:`, !!value, "options:", options);
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            console.log(`[Auth Callback] Removing cookie ${name}`);
            response.cookies.delete({ name, ...options });
          },
        },
      },
    );

    try {
      console.log("[Auth Callback] About to exchange code for session...");

      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[Auth Callback] Error exchanging code:", error.message);
        throw error;
      }

      console.log("[Auth Callback] Code exchange successful. Data:", {
        hasUser: !!data.user,
        hasSession: !!data.session,
        userEmail: data.user?.email,
        userId: data.user?.id
      });

      if (data.user) {
        console.log("[Auth Callback] User authenticated:", data.user.email);

                  // Check if user exists in our User table
          const { data: existingUser, error: userCheckError } = await supabase
            .from('User')
            .select('id, tenantId')
            .eq('supabaseUserId', data.user.id)
            .single();

        if (userCheckError && userCheckError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error("[Auth Callback] Error checking user:", userCheckError);
        }

        let isFirstTimeUser = false;
        let redirectPath = next;

        // If user doesn't exist in our table, create them
        if (!existingUser) {
          console.log("[Auth Callback] Creating new user record for:", data.user.email);
          isFirstTimeUser = true;

          // Create a new tenant for the user
          const { data: newTenant, error: tenantError } = await supabase
            .from('Tenant')
            .insert({
              name: `${data.user.user_metadata?.full_name || data.user.email}'s Kennel`,
              subdomain: null, // Will be set during kennel setup
              createdAt: new Date().toISOString(),
            })
            .select()
            .single();

          if (tenantError) {
            console.error("[Auth Callback] Error creating tenant:", tenantError);
            throw tenantError;
          }

          console.log("[Auth Callback] Created new tenant:", newTenant.id);

          // Create the user record
          const { data: newUser, error: createError } = await supabase
            .from('User')
            .insert({
              supabaseUserId: data.user.id,
              email: data.user.email,
              firstName: data.user.user_metadata?.full_name?.split(' ')[0] || '',
              lastName: data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
              tenantId: newTenant.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error("[Auth Callback] Error creating user:", createError);
            throw createError;
          }

          console.log("[Auth Callback] User record created successfully");

          // Create UserTenant link with admin role
          const { error: userTenantError } = await supabase
            .from('UserTenant')
            .insert({
              user_id: newUser.id, // Use the ID from our User table, not Supabase auth user ID
              tenant_id: newTenant.id,
              role: 'admin'
            });

          if (userTenantError) {
            console.error("[Auth Callback] Error creating user-tenant link:", userTenantError);
            // Don't throw - user is still created
          }

          // Redirect first-time users to kennel setup
          redirectPath = '/kennel-setup';
        } else {
          console.log("[Auth Callback] User already exists in our table with tenant:", existingUser.tenantId);
          
          // Check if user has completed kennel setup (has rooms, etc.)
          if (existingUser.tenantId) {
            const { data: roomCount, error: roomError } = await supabase
              .from('Room')
              .select('id', { count: 'exact' })
              .eq('tenantId', existingUser.tenantId);

            if (roomError) {
              console.error("[Auth Callback] Error checking rooms:", roomError);
            } else if (!roomCount || roomCount.length === 0) {
              console.log("[Auth Callback] User has no rooms, redirecting to kennel setup");
              redirectPath = '/kennel-setup';
            }
          } else {
            console.log("[Auth Callback] User has no tenant, redirecting to kennel setup");
            redirectPath = '/kennel-setup';
          }
        }

        // Update the redirect response
        response = NextResponse.redirect(`${origin}${redirectPath}`);

        // Verify session is set by checking cookies
        console.log("[Auth Callback] Final response cookies:", Array.from(response.cookies.getAll()));
      }

      return response;
    } catch (e) {
      console.error("[Auth Callback] Exception during code exchange:", e);
    }
  }

  // If code is missing or failed, go back to login with error
  console.log("[Auth Callback] No code or failed, redirecting to login with error");
  const errorUrl = new URL("/login", origin);
  errorUrl.searchParams.set(
    "error",
    "Could not authenticate user. Please try again.",
  );
  return NextResponse.redirect(errorUrl);
} 