import { createHandler } from "@/lib/apiHandler";
import {
  listTenants,
  listTenantsForUser,
  createTenant,
} from "@/services/tenants";
import { createServerSupabaseClient } from "@/lib/auth";
import { cookies } from "next/headers";
import { isGlobalAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createHandler(async ({ client }) => {
  // Identify user and permissions
  const ssrClient = await createServerSupabaseClient();
  const {
    data: { session },
  } = await ssrClient.auth.getSession();

  // Global admins can fetch every tenant
  if (await isGlobalAdmin()) {
    return await listTenants(client);
  }

  // Non-authenticated users get nothing
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Regular users: fetch only tenants they are linked to
  return await listTenantsForUser(client, session.user.id);
});

export const POST = createHandler(async ({ client, body }) => {
  // fetch current user session via SSR client
  const ssrClient = await createServerSupabaseClient();
  const {
    data: { session },
  } = await ssrClient.auth.getSession();

  const sessionUser = session
    ? {
        supabaseUserId: session.user.id,
        email: session.user.email ?? null,
        name:
          (session.user.user_metadata as any)?.name ??
          session.user.email?.split("@")[0] ??
          null,
      }
    : null;

  const tenant = await createTenant(client, body, sessionUser, supabaseAdmin());

  // Ensure the authenticated user is linked as OWNER using service role to bypass RLS
  if (tenant?.id && sessionUser) {
    const admin = supabaseAdmin();
    try {
      // First, get the User record ID using the supabaseUserId
      const { data: userRecord, error: userError } = await admin
        .from("User")
        .select("id")
        .eq("supabaseUserId", sessionUser.supabaseUserId)
        .single();

      if (userError || !userRecord) {
        console.error("[api/tenants] Failed to find user record:", userError);
        throw new Error("User record not found");
      }

      // Link the User.id (not supabaseUserId) to the tenant
      await admin.from("UserTenant").upsert(
        {
          user_id: userRecord.id,
          tenant_id: tenant.id,
          role: "OWNER",
        },
        { onConflict: "user_id,tenant_id" },
      );

      console.log(
        "[api/tenants] Successfully linked user",
        userRecord.id,
        "to tenant",
        tenant.id,
      );
    } catch (linkErr) {
      console.error(
        "[api/tenants] Failed linking user to tenant via admin",
        linkErr,
      );
      throw linkErr;
    }
  }

  // set tenant cookie for immediate use
  if (tenant?.id) {
    cookies().set("tenantId", tenant.id, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return tenant;
});
