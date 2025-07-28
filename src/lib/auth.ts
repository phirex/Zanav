import { createServerClient } from "@supabase/ssr";
import { CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_TENANT_ID } from "./tenant";

// Define Role enum locally to match Prisma schema
export enum Role {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  STAFF = "STAFF",
  VIEWER = "VIEWER",
}

/**
 * Gets a supabase client for client-side usage
 */
export const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey);
};

/**
 * Role hierarchy utility that can be used in both client and server
 */
export const roleValues: Record<Role, number> = {
  [Role.OWNER]: 4,
  [Role.ADMIN]: 3,
  [Role.STAFF]: 2,
  [Role.VIEWER]: 1,
};

/**
 * Checks if a role is sufficient compared to a required role
 * Can be used on both client and server
 */
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return roleValues[userRole] >= roleValues[requiredRole];
}

// NOTE: Server-only functions below.
// These functions must be imported only in Server Components or API routes
// Do not import these in client components (those with 'use client' directive)

/**
 * Helper to create a supabase server client for server-side auth
 * @server-only
 */
export async function createServerSupabaseClient() {
  // This is a dynamic import to prevent next/headers from being imported on client
  const { cookies } = await import("next/headers");
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // Log error or handle gracefully
            // console.warn(`Failed to set cookie '${name}' in a Server Component context.`);
            // The Supabase client expects these functions to be available,
            // but errors should be suppressed in contexts where modification isn't allowed.
          }
        },
        remove: (name: string, options: CookieOptions) => {
          try {
            // Setting the value to '' with maxAge 0 effectively removes the cookie
            cookieStore.set(name, "", { ...options, maxAge: 0 });
          } catch (error) {
            // Log error or handle gracefully
            // console.warn(`Failed to remove cookie '${name}' in a Server Component context.`);
          }
        },
      },
    },
  );
}

/**
 * Gets the current authenticated user from Supabase Auth
 * @server-only
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Checks if the current user is a global admin
 * @server-only
 * @returns {Promise<boolean>} true if the user is a global admin
 */
export async function isGlobalAdmin(): Promise<boolean> {
  // GlobalAdmin functionality temporarily disabled
  return false;
}

/**
 * Gets the user's role for a specific tenant
 * @server-only
 * @param userId The user's ID
 * @param tenantId The tenant ID to check roles for
 * @returns The user's role or null if no access
 */
export async function getUserRole(
  userId: string,
  tenantId: string = DEFAULT_TENANT_ID,
): Promise<Role | null> {
  if (!userId) return null;

  try {
    // Dynamic import to keep supabaseServer import server-side only
    const { supabaseServer } = await import("./supabase");
    const supabase = supabaseServer();

    // First, get the User record ID using the supabaseUserId
    const { data: userRecord, error: userError } = await supabase
      .from("User")
      .select("id")
      .eq("supabaseUserId", userId)
      .single();

    if (userError || !userRecord) {
      console.error("Error getting user record:", userError);
      return null;
    }

    // Now check if the User.id is linked to this tenant
    const { data, error } = await supabase
      .from("UserTenant")
      .select("role")
      .eq("user_id", userRecord.id)
      .eq("tenant_id", tenantId)
      .single();

    if (error || !data) {
      console.error("Error getting user role:", error);
      return null;
    }

    return data.role as Role;
  } catch (error) {
    console.error("Error checking role:", error);
    return null;
  }
}

/**
 * Checks if a user has at least the required role for a tenant
 * @server-only
 * @param userId The user's ID
 * @param requiredRole The minimum role required
 * @param tenantId The tenant ID to check
 * @returns true if the user has sufficient permissions
 */
export async function hasRequiredRole(
  userId: string,
  requiredRole: Role,
  tenantId: string = DEFAULT_TENANT_ID,
): Promise<boolean> {
  if (!userId) return false;

  const userRole = await getUserRole(userId, tenantId);
  if (!userRole) return false;

  return hasMinimumRole(userRole, requiredRole);
}

/**
 * Check if the current authenticated user has access to a specific tenant
 * @server-only
 * @param tenantId The tenant to check access for
 * @returns {Promise<boolean>} true if the user has access
 */
export async function userHasTenantAccess(tenantId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  // Global admins have access to all tenants
  const adminStatus = await isGlobalAdmin();
  if (adminStatus) return true;

  return (await getUserRole(user.id, tenantId)) !== null;
}
