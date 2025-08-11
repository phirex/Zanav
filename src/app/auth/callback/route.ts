import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Prepare redirect response
  let response = NextResponse.redirect(`${origin}${next}`);

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.delete({ name, ...options });
          },
        },
      },
    );

    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("[Auth Callback] Error exchanging code:", error.message);
        throw error;
      }

      if (data.user) {
        console.log("[Auth Callback] User authenticated:", data.user.email);
        
        // Check if user exists in our User table
        const { data: existingUser, error: userCheckError } = await supabase
          .from('User')
          .select('id')
          .eq('supabase_user_id', data.user.id)
          .single();

        if (userCheckError && userCheckError.code !== 'PGRST116') {
          console.error("[Auth Callback] Error checking user:", userCheckError);
        }

        // If user doesn't exist in our table, create them
        if (!existingUser) {
          console.log("[Auth Callback] Creating new user record for:", data.user.email);
          
          const { error: createError } = await supabase
            .from('User')
            .insert({
              supabase_user_id: data.user.id,
              email: data.user.email,
              first_name: data.user.user_metadata?.full_name?.split(' ')[0] || '',
              last_name: data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
              tenant_id: 'c97bd573-06b9-4093-bb30-002d6e3bb0b9', // Default tenant
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (createError) {
            console.error("[Auth Callback] Error creating user:", createError);
            // Don't throw - user is still authenticated, just missing from our table
          } else {
            console.log("[Auth Callback] User record created successfully");
          }
        } else {
          console.log("[Auth Callback] User already exists in our table");
        }
      }

      return response;
    } catch (e) {
      console.error("[Auth Callback] Exception during code exchange:", e);
    }
  }

  // If code is missing or failed, go back to login with error
  const errorUrl = new URL("/login", origin);
  errorUrl.searchParams.set(
    "error",
    "Could not authenticate user. Please try again.",
  );
  return NextResponse.redirect(errorUrl);
} 