import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function debugInfo(
  client: SupabaseClient<Database>,
  session: any,
) {
  const cookieStore = await import("next/headers").then((m) => m.cookies());
  const allCookies = cookieStore.getAll();
  const cookieNames = allCookies.map((c) => c.name);

  let adminStatus = { isAdmin: false, details: null as any };
  let directAdminCheck = { pascal: null as any, snake: null as any };

  if (session?.user) {
    const uid = session.user.id;

    // GlobalAdmin table not available in current schema
    const adminPascal = null;

    directAdminCheck = { pascal: adminPascal, snake: null };
    adminStatus = { isAdmin: false, details: null };
  }

  return {
    timestamp: new Date().toISOString(),
    session: session
      ? { userId: session.user.id, email: session.user.email }
      : null,
    userData: session?.user ?? null,
    adminCheck: adminStatus,
    directTableChecks: directAdminCheck,
    cookies: cookieNames,
    allCookieDetails: allCookies,
  };
}
