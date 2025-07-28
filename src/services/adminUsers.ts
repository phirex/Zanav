import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";

export async function listAuthUsers(client: SupabaseClient<Database>) {
  try {
    // @ts-ignore service role function may not exist in anon env
    const { data, error } = await client.auth.admin.listUsers();
    if (error) throw new Error(error.message);
    return data.users;
  } catch (err) {
    console.error("[admin users] fallback to dummy", err);
    return [];
  }
}
