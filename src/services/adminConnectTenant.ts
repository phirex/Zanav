import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

interface ConnectInput {
  supabaseUserId: string;
  email: string | null | undefined;
  name: string | null | undefined;
  tenantId: string;
}

export async function connectTenantAsOwner(
  client: SupabaseClient<Database>,
  { supabaseUserId, email, name, tenantId }: ConnectInput,
) {
  // 1. Verify tenant exists
  const { data: tenant, error: tenantErr } = await client
    .from("Tenant")
    .select("id, name")
    .eq("id", tenantId)
    .maybeSingle();
  if (tenantErr || !tenant) throw new Error("Tenant not found");

  // 2. Fetch or create User record (application-level)
  const { data: existingUser } = await client
    .from("User")
    .select("id")
    .eq("supabaseUserId", supabaseUserId)
    .maybeSingle();

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: newUser, error: createUserErr } = await client
      .from("User")
      .insert({
        supabaseUserId,
        email,
        name: name || email?.split("@")[0] || "Admin",
      })
      .select("id")
      .single();
    if (createUserErr) throw new Error(createUserErr.message);
    userId = newUser.id;
  }

  // 3. Assign OWNER role if not present
  const { data: roleExisting } = await client
    .from("UserTenant")
    .select("id")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!roleExisting) {
    const { error: roleErr } = await client.from("UserTenant").insert({
      user_id: userId,
      tenant_id: tenantId,
      role: "OWNER",
    });
    if (roleErr) throw new Error(roleErr.message);
  }

  return { tenant };
}
