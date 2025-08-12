import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  console.log("[Auth Callback] incoming", { url: request.url, hasCode: !!code, next });

  let response = NextResponse.redirect(`${origin}${next}`);

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const v = cookieStore.get(name)?.value;
            console.log("[Auth Callback] get cookie", name, !!v);
            return v;
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log("[Auth Callback] set cookie", name, !!value);
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            console.log("[Auth Callback] remove cookie", name);
            response.cookies.delete({ name, ...options });
          },
        },
      },
    );

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;

      console.log("[Auth Callback] exchanged", { hasUser: !!data.user, hasSession: !!data.session, email: data.user?.email });

      if (data.user) {
        const { data: existingUser, error: userCheckError } = await supabase
          .from("User")
          .select("id")
          .eq("supabaseUserId", data.user.id)
          .maybeSingle();

        if (!existingUser && !userCheckError) {
          console.log("[Auth Callback] creating app user row");
          await supabase
            .from("User")
            .insert({
              supabaseUserId: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "",
            });
        }
      }

      console.log("[Auth Callback] redirecting to", `${origin}${next}`);
      return response;
    } catch (e: any) {
      console.error("[Auth Callback] error", e?.message || e);
    }
  }

  const errorUrl = new URL("/login", origin);
  errorUrl.searchParams.set("error", "Could not authenticate user. Please try again.");
  console.log("[Auth Callback] failing, redirecting to", errorUrl.toString());
  return NextResponse.redirect(errorUrl);
} 