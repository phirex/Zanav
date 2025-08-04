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
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return response;
      }
      console.error("[Auth Callback] Error exchanging code:", error.message);
    } catch (e) {
      console.error("[Auth Callback] Exception during code exchange:", e);
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