import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";

export async function listTenantsWithOwner(client: SupabaseClient<Database>) {
  // 1. tenants
  const { data: tenants, error: tenantErr } = await client
    .from("Tenant")
    .select("id, name, createdAt")
    .order("createdAt", { ascending: false });
  if (tenantErr) throw new Error(tenantErr.message);
  if (!tenants || tenants.length === 0) return [];

  // 2. owner userTenant rows
  const tenantIds = tenants.map((t) => t.id);
  const { data: links, error: linkErr } = await client
    .from("UserTenant")
    .select("user_id, tenant_id")
    .in("tenant_id", tenantIds)
    .eq("role", "OWNER");
  if (linkErr) throw new Error(linkErr.message);

  let ownerEmails: Record<string, string> = {};
  if (links && links.length) {
    const ownerUserIds = links.map((l) => l.user_id);
    try {
      // @ts-ignore service-role
      const { data } = await client.auth.admin.listUsers();
      const users = data?.users || [];
      users.forEach((u: any) => {
        ownerEmails[u.id] = u.email ?? "";
      });
    } catch (err) {
      console.warn("admin listUsers failed", err);
    }
  }

  return tenants.map((t) => {
    const ownerLink = links?.find((l) => l.tenant_id === t.id);
    return {
      id: t.id,
      name: t.name,
      createdAt: t.createdAt,
      ownerEmail: ownerLink ? ownerEmails[ownerLink.user_id] || null : null,
    };
  });
}

export async function createTenantAdmin(
  client: SupabaseClient<Database>,
  name: string,
) {
  if (!name.trim()) throw new Error("Tenant name required");
  const { data: existing } = await client
    .from("Tenant")
    .select("id")
    .eq("name", name.trim())
    .maybeSingle();
  if (existing) throw new Error("Tenant exists");

  const { data, error } = await client
    .from("Tenant")
    .insert({ name: name.trim() })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTenant(
  client: SupabaseClient<Database>,
  tenantId: string,
) {
  if (!tenantId) throw new Error("Tenant ID required");

  // Verify tenant exists
  const { data: tenant, error: tenantErr } = await client
    .from("Tenant")
    .select("id, name")
    .eq("id", tenantId)
    .maybeSingle();
  if (tenantErr) throw new Error(tenantErr.message);
  if (!tenant) throw new Error("Tenant not found");

  // Delete all user-tenant links first
  const { error: linkErr } = await client
    .from("UserTenant")
    .delete()
    .eq("tenant_id", tenantId);
  if (linkErr) throw new Error(linkErr.message);

  // TODO: cascade delete other tenant-scoped entities if necessary

  // Delete the tenant itself
  const { error: delErr } = await client
    .from("Tenant")
    .delete()
    .eq("id", tenantId);
  if (delErr) throw new Error(delErr.message);

  return {
    success: true,
    message: `Tenant \"${tenant.name}\" has been deleted`,
  };
}

interface ConnectAdminInput {
  tenantId: string;
  session: {
    user: {
      id: string;
      email: string | null;
      user_metadata?: any;
    };
  };
}

export async function connectTenantAdmin(
  client: SupabaseClient<Database>,
  { tenantId, session }: ConnectAdminInput,
) {
  // 1. verify tenant exists
  const { data: tenant, error: tenantErr } = await client
    .from("Tenant")
    .select("id, name")
    .eq("id", tenantId)
    .maybeSingle();
  if (tenantErr) throw new Error(tenantErr.message);
  if (!tenant) throw new Error("Tenant not found");

  // 2. find or create application-level User record
  const supabaseUserId = session.user.id;
  const email = session.user.email;
  const name =
    session.user.user_metadata?.name || email?.split("@")[0] || "Admin";

  const { data: existingUser } = await client
    .from("User")
    .select("id")
    .eq("supabaseUserId", supabaseUserId)
    .maybeSingle();

  let userId: string;
  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: created, error: createUserErr } = await client
      .from("User")
      .insert({ supabaseUserId, email, name })
      .select("id")
      .single();
    if (createUserErr) throw new Error(createUserErr.message);
    userId = created.id;
  }

  // 3. upsert ADMIN role link
  const { error: linkErr } = await client.from("UserTenant").upsert(
    {
      user_id: userId,
      tenant_id: tenantId,
      role: "ADMIN",
    },
    { onConflict: "user_id,tenant_id" },
  );
  if (linkErr) throw new Error(linkErr.message);

  return { tenant };
}
