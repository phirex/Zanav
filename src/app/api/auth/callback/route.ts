import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Create a response object to potentially modify cookies on
  let response = NextResponse.redirect(`${origin}${next}`);

  if (code) {
    const cookieStore = cookies(); // Use for reading request cookies
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            // Read from the incoming request cookies
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Set cookies on the outgoing response object
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            // Remove cookies from the outgoing response object
            response.cookies.delete({ name, ...options });
          },
        },
      },
    );

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.user) {
        // Check if this is an OAuth user (Google, etc.)
        if (data.user.app_metadata?.provider === 'google') {
          console.log("[Auth Callback] Processing OAuth user:", data.user.email);
          
          // Handle OAuth user creation in a separate process
          // We'll let the user creation happen naturally through Supabase Auth hooks
          // or handle it in the frontend after successful authentication
        }

        // Successful exchange, return the redirect response
        // which now includes the set-cookie headers from supabase
        return response;
      }
      console.error("[Auth Callback] Error exchanging code:", error?.message);
    } catch (e) {
      console.error("[Auth Callback] Exception during code exchange:", e);
      // Fall through to the error redirect below
    }
  }

  // If code is missing, or exchange failed, redirect to login with error
  console.log("[Auth Callback] Failed - Redirecting to login with error");
  const errorUrl = new URL("/login", origin);
  errorUrl.searchParams.set(
    "error",
    "Could not authenticate user. Please try again.",
  );
  return NextResponse.redirect(errorUrl);
}
