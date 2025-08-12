import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

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
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;

      if (data.user) {
        // Ensure user exists in our "User" table with current column names
        const { data: existingUser, error: userCheckError } = await supabase
          .from("User")
          .select("id")
          .eq("supabaseUserId", data.user.id)
          .maybeSingle();

        if (!existingUser && !userCheckError) {
          await supabase
            .from("User")
            .insert({
              supabaseUserId: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "",
            });
        }
      }

      return response;
    } catch (e) {
      // fallthrough to error redirect
    }
  }

  const errorUrl = new URL("/login", origin);
  errorUrl.searchParams.set("error", "Could not authenticate user. Please try again.");
  return NextResponse.redirect(errorUrl);
} 