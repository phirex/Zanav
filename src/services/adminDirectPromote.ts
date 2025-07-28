import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function promoteUserDirect(
  client: SupabaseClient<Database>,
  userId: string,
  email: string,
  name?: string | null,
) {
  if (!userId || !email) throw new Error("User ID and email required");

  // 1. Ensure the `GlobalAdmin` table exists (assume migration has run)
  // (Removed runtime DDL)

  // 2. Insert user (parameterized via RPC for safety)
  const { error: insertRpcErr } = await client.rpc("execute_sql", {
    sql: `INSERT INTO public."GlobalAdmin" ("supabaseUserId", email, name)
          VALUES ($1, $2, $3)
          ON CONFLICT ("supabaseUserId") DO NOTHING;`,
    params: [userId, email, name || ""],
  });

  if (insertRpcErr) {
    // fallback simple insert
    const { error: insertErr } = await client
      .from("GlobalAdmin")
      .insert([{ supabaseUserId: userId, email, name }]);
    if (insertErr)
      throw new Error(`Failed to promote user: ${insertErr.message}`);
  }

  return { success: true, message: "User promoted to global admin" };
}
