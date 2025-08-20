import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";
import { Role } from "@/lib/auth";
import { assertUserInviteAllowed } from "@/lib/plan";

interface ListUsersInput {
  tenantId: string;
  isGlobalAdmin: boolean;
}

export async function listUsers(
  client: SupabaseClient<Database>,
  { tenantId, isGlobalAdmin }: ListUsersInput,
) {
  if (isGlobalAdmin) {
    const { data, error } = await client
      .from("User")
      .select("id, email, name")
      .order("createdAt", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((u) => ({
      userId: u.id,
      role: "GLOBAL_ADMIN",
      user: u,
    }));
  }

  const { data, error } = await client
    .from("UserTenant")
    .select(`user_id, role, user:User(id, email, name)`)
    .eq("tenant_id", tenantId);
  if (error) throw new Error(error.message);
  return data;
}

interface AddUserInput {
  tenantId: string;
  email: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: Role | string;
  password?: string;
  createWithPassword?: boolean;
}

export async function addUser(
  client: SupabaseClient<Database>,
  {
    tenantId,
    email,
    name,
    firstName,
    lastName,
    role,
    password,
    createWithPassword,
  }: AddUserInput,
) {
  if (!email || !role) throw new Error("Email and role are required");
  // Enforce plan user limit (Standard plan)
  await assertUserInviteAllowed(tenantId);
  let userId: string;
  let supabaseUserId: string | null = null;

  // existing user?
  const { data: existingUser } = await client
    .from("User")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    userId = existingUser.id;
    if (firstName || lastName || name) {
      const { error: updateErr } = await client
        .from("User")
        .update({
          name,
          firstName,
          lastName,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", userId);
      if (updateErr) throw new Error(updateErr.message);
    }
  } else {
    // create auth user if requested
    if (createWithPassword) {
      // @ts-ignore service role
      const { data: authUser, error: authErr } =
        await client.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, firstName, lastName },
        });
      if (authErr)
        throw new Error("Failed to create auth user: " + authErr.message);
      supabaseUserId = authUser.user.id;
    }

    const { data: newUser, error: userErr } = await client
      .from("User")
      .insert({ email, name, firstName, lastName, supabaseUserId })
      .select("id")
      .single();
    if (userErr) throw new Error(userErr.message);
    userId = newUser.id;
  }

  // upsert role
  const { error: roleErr } = await client.from("UserTenant").upsert(
    {
      user_id: userId,
      tenant_id: tenantId,
      role,
    },
    { onConflict: "user_id,tenant_id" },
  );
  if (roleErr) throw new Error(roleErr.message);

  return { success: true };
}

interface GetUserInput {
  tenantId: string;
  userId: string;
}
export async function getUser(
  client: SupabaseClient<Database>,
  { tenantId, userId }: GetUserInput,
) {
  const { data, error } = await client
    .from("UserTenant")
    .select(`user_id, role, user:User(id, email, name)`)
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("User not found in tenant");
  return data;
}

interface UpdateUserRoleInput {
  tenantId: string;
  userId: string;
  role: Role | string;
}
export async function updateUserRole(
  client: SupabaseClient<Database>,
  { tenantId, userId, role }: UpdateUserRoleInput,
) {
  const { error } = await client
    .from("UserTenant")
    .update({ role })
    .eq("user_id", userId)
    .eq("tenant_id", tenantId);
  if (error) throw new Error(error.message);
  return { success: true };
}

interface RemoveUserInput {
  tenantId: string;
  userId: string;
  currentUserId: string;
}
export async function removeUser(
  client: SupabaseClient<Database>,
  { tenantId, userId, currentUserId }: RemoveUserInput,
) {
  if (userId === currentUserId) throw new Error("You cannot remove yourself");
  // remove relationship
  const { error } = await client
    .from("UserTenant")
    .delete()
    .eq("user_id", userId)
    .eq("tenant_id", tenantId);
  if (error) throw new Error(error.message);
  return { success: true };
}
