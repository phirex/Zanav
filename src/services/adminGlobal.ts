import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

interface PromoteInput {
  userId: string;
  email: string;
  name?: string | null;
}

/**
 * Inserts a user into one of the GlobalAdmin tables (Pascal or snake) if they are not already present.
 * Falls back gracefully if one convention does not exist.
 */
export async function promoteUserToGlobalAdmin(
  client: SupabaseClient<Database>,
  { userId, email, name }: PromoteInput,
) {
  // GlobalAdmin functionality temporarily disabled
  throw new Error("Global admin promotion temporarily disabled - GlobalAdmin table not in current schema");
}

/**
 * Convenience wrapper to promote the currently authenticated user (via session)
 * to global admin. Requires that you provide their supabase session details.
 */
export async function promoteSelfToGlobalAdmin(
  client: SupabaseClient<Database>,
  session: {
    user: { id: string; email: string | null | undefined; user_metadata?: any };
  } | null,
) {
  if (!session || !session.user) throw new Error("No session");
  const { id, email, user_metadata } = session.user;
  const name = user_metadata?.name || email?.split("@")[0] || null;

  return await promoteUserToGlobalAdmin(client, {
    userId: id,
    email: email || "", // email technically cannot be null for signed-in users
    name,
  });
}
