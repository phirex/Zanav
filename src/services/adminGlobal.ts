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
  if (!userId || !email) throw new Error("userId & email required");

  // 1. Check existing in PascalCase
  const { data: existingPascal } = await client
    .from("GlobalAdmin")
    .select("id")
    .eq("supabaseUserId", userId)
    .maybeSingle();
  if (existingPascal) return { alreadyAdmin: true };

  // 2. Insert in PascalCase only
  const { data: insertedPascal, error: insertPascalErr } = await client
    .from("GlobalAdmin")
    .insert({ supabaseUserId: userId, email, name })
    .select()
    .single();
  if (insertPascalErr) throw new Error(insertPascalErr.message);
  return { adminRecord: insertedPascal };
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
