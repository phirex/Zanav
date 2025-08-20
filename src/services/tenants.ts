import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

export async function listTenants(client: SupabaseClient<Database>) {
  const { data, error } = await client.from("Tenant").select("*").order("name");
  if (error) throw new Error(error.message);
  return data;
}

export async function getTenant(client: SupabaseClient<Database>, id: string) {
  const { data, error } = await client
    .from("Tenant")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

interface SessionUser {
  supabaseUserId: string;
  email: string | null;
  name: string | null;
}

export async function createTenant(
  client: SupabaseClient<Database>,
  body: any,
  sessionUser?: SessionUser | null,
  adminClient?: SupabaseClient<Database>,
) {
  const { name, subdomain } = body;
  if (!name || !subdomain) throw new Error("Name and subdomain are required");
  const sanitized = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "");

  // Ensure subdomain uniqueness
  const { data: existing, error: checkErr } = await client
    .from("Tenant")
    .select("id")
    .eq("subdomain", sanitized)
    .maybeSingle();
  if (checkErr) throw new Error(checkErr.message);
  if (existing) throw new Error("Subdomain is already in use");

  // Create tenant row
  const { data: newTenant, error } = await client
    .from("Tenant")
    .insert({ name, subdomain: sanitized })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  // Create default settings for the new tenant
  const defaultSettings = [
    { key: "whatsappEnabled", value: "false" },
    { key: "currency", value: "ILS" },
    { key: "kennelName", value: name },
    { key: "plan", value: "standard" },
  ];

  const now = new Date().toISOString();
  const settingsToInsert = defaultSettings.map((setting) => ({
    key: setting.key,
    value: setting.value,
    tenantId: newTenant.id,
    createdAt: now,
    updatedAt: now,
  }));

  // Use admin client for settings and room creation to bypass RLS
  const clientToUse = adminClient || client;

  // Insert all default settings (including kennelName)
  await clientToUse.from("Setting").insert(settingsToInsert);

  // Create a single default room for the new tenant
  await clientToUse.from("Room").insert({
    name: "Default room",
    displayName: "Default room",
    maxCapacity: 5,
    capacity: 0,
    tenantId: newTenant.id,
  });

  // (Remove the separate kennelName insert, as it's now included above)

  // Create default room and settings after tenant creation
  // Note: We'll skip the initial setup here and let the dashboard create them when needed
  // This avoids RLS policy conflicts during tenant creation
  console.log(
    "ℹ️ Default room and settings will be created when user first accesses dashboard",
  );

  // If a session user is provided, ensure User & OWNER role
  if (sessionUser) {
    const { supabaseUserId, email, name: fullName } = sessionUser;

    // upsert into User table (handle case where signup already created the record)
    const { data: existingUser } = await client
      .from("User")
      .select("id")
      .eq("supabaseUserId", supabaseUserId)
      .maybeSingle();

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      // Update the existing user record with latest info if needed
      if (fullName && fullName !== "User") {
        await client
          .from("User")
          .update({ name: fullName, updatedAt: new Date().toISOString() })
          .eq("id", existingUser.id);
      }
    } else {
      // Create new user record (fallback if signup didn't create it)
      const { data: newUser, error: userErr } = await client
        .from("User")
        .insert({ supabaseUserId, email, name: fullName })
        .select("id")
        .single();
      if (userErr) throw new Error(userErr.message);
      userId = newUser.id;
    }

    // Verify the Auth user exists before creating UserTenant relationship
    try {
      // @ts-ignore - service role can access admin functions
      const { data: authUser, error: authCheckErr } =
        await client.auth.admin.getUserById(supabaseUserId);
      if (authCheckErr || !authUser?.user) {
        throw new Error(`Auth user ${supabaseUserId} not found`);
      }

      // link as OWNER (ignore duplicates)
      const { error: linkErr } = await client.from("UserTenant").upsert(
        {
          user_id: supabaseUserId, // Use Supabase Auth user ID, not internal User.id
          tenant_id: newTenant.id,
          role: "OWNER",
        },
        { onConflict: "user_id,tenant_id" },
      );
      if (linkErr) throw new Error(linkErr.message);

      console.log("✅ Created UserTenant relationship");
    } catch (userTenantError) {
      console.error(
        "Failed to create UserTenant relationship:",
        userTenantError instanceof Error
          ? userTenantError.message
          : String(userTenantError),
      );
      // Don't throw - tenant is created, user can be linked later
      console.warn("User will need to be linked to tenant manually");
    }
  }

  return newTenant;
}

export async function listTenantsForUser(
  client: SupabaseClient<Database>,
  supabaseUserId: string,
) {
  // Use the Supabase Auth user ID directly - no need to look up internal User table
  console.log(
    `[listTenantsForUser] Looking up tenants for Supabase user: ${supabaseUserId}`,
  );

  // Fetch tenant links for this user using the Supabase Auth user ID
  const { data: links, error: linkErr } = await client
    .from("UserTenant")
    .select("tenant_id")
    .eq("user_id", supabaseUserId); // ✅ Fixed: Use supabaseUserId directly
  if (linkErr) throw new Error(linkErr.message);
  if (!links || links.length === 0) {
    console.log(
      `[listTenantsForUser] No tenant links found for user: ${supabaseUserId}`,
    );
    return [];
  }

  const tenantIds = links.map((l) => l.tenant_id);
  console.log(
    `[listTenantsForUser] Found tenant links: ${tenantIds.join(", ")}`,
  );

  // Retrieve the tenant rows in a stable order
  const { data: tenants, error: tenantErr } = await client
    .from("Tenant")
    .select("*")
    .in("id", tenantIds)
    .order("name");
  if (tenantErr) throw new Error(tenantErr.message);

  console.log(`[listTenantsForUser] Retrieved ${tenants.length} tenants`);
  return tenants;
}
