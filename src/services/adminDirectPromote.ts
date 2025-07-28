import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function promoteUserDirect(
  client: SupabaseClient<Database>,
  userId: string,
  email: string,
  name?: string | null,
) {
  // GlobalAdmin functionality temporarily disabled
  throw new Error("Global admin promotion temporarily disabled - GlobalAdmin table not in current schema");
}
