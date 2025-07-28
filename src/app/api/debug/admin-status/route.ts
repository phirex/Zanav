import { NextRequest, NextResponse } from "next/server";
import { isGlobalAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export { dynamic } from "@/lib/forceDynamic";

// GET /api/debug/admin-status - Debug endpoint to check global admin status
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set(name, "", { ...options, maxAge: 0 });
          },
        },
      },
    );
    const serverClient = supabaseServer();

    // Get the current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ loggedIn: false, error: "Not logged in" });
    }

    const userId = session.user.id;
    const email = session.user.email;

    // Check GlobalAdmin table directly
    const { data: globalAdminPascal, error: adminPascalError } =
      await serverClient
        .from("GlobalAdmin")
        .select("*")
        .eq("supabaseUserId", userId)
        .maybeSingle();

    // Use the isGlobalAdmin helper
    const isAdmin = await isGlobalAdmin();

    return NextResponse.json({
      loggedIn: true,
      userId,
      email,
      directCheckResult: {
        isAdmin: !!globalAdminPascal,
        adminData: globalAdminPascal,
        pascalError: adminPascalError ? adminPascalError.message : null,
      },
      helperCheckResult: {
        isAdmin,
      },
    });
  } catch (error: any) {
    console.error("Error in admin status check:", error);
    return NextResponse.json(
      { error: `Error checking admin status: ${error.message}` },
      { status: 500 },
    );
  }
}
