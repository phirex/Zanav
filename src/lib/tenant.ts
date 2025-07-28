// We'll use dynamic imports to avoid importing server-only code on the client
// Import types for TypeScript support
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CookieOptions } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * Default tenant ID to use when no tenant is specified
 * This might be useful for single-tenant setups or as a fallback
 */
export const DEFAULT_TENANT_ID =
  process.env.DEFAULT_TENANT_ID || "00000000-0000-0000-0000-000000000000";

/**
 * Extract the subdomain from a hostname
 */
function extractSubdomain(hostname: string): string | null {
  // Check for localhost or IP address (for development)
  if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  // Check for example.com, www.example.com, etc.
  const parts = hostname.split(".");
  if (parts.length <= 2) {
    return null; // No subdomain (e.g., example.com)
  }

  if (parts[0] === "www") {
    return parts.length > 3 ? parts[1] : null;
  }

  return parts[0]; // First part is the subdomain
}

/**
 * Get tenant ID from the request or cookies
 * @server-only
 */
export async function getTenantId(request?: Request): Promise<string> {
  try {
    // First check if we have a request to extract from
    if (request) {
      const url = new URL(request.url);
      const hostname = url.hostname;
      const subdomain = extractSubdomain(hostname);

      if (subdomain) {
        const tenantId = await getTenantIdBySubdomain(subdomain);
        if (tenantId) {
          return tenantId;
        }
      }

      // Check for tenant ID in headers (set by middleware)
      const tenantHeader = request.headers.get("x-tenant-id");
      if (tenantHeader) {
        return tenantHeader;
      }
    }

    // As a fallback check cookies (for server components)
    const { cookies } = await import("next/headers");
    const { createServerClient } = await import("@supabase/ssr");
    const cookieStore = cookies();

    // Check for tenant cookie
    const tenantCookie = cookieStore.get("tenantId");
    if (tenantCookie) {
      return tenantCookie.value;
    }

    // Check for admin tenant cookie
    const adminTenantCookie = cookieStore.get("admin-tenant-id");
    if (adminTenantCookie) {
      return adminTenantCookie.value;
    }

    // Try to get from user metadata
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Server components can't set cookies
          },
          remove(name: string, options: CookieOptions) {
            // Server components can't remove cookies
          },
        },
      },
    );
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.user_metadata?.currentTenantId) {
      return session.user.user_metadata.currentTenantId;
    }

    // Default tenant as last resort
    console.log(`Using default tenant ID: ${DEFAULT_TENANT_ID}`);
    return DEFAULT_TENANT_ID;
  } catch (error) {
    console.error("Error determining tenant ID:", error);
    return DEFAULT_TENANT_ID;
  }
}

/**
 * Look up tenant ID by subdomain
 * @server-only
 */
async function getTenantIdBySubdomain(
  subdomain: string,
): Promise<string | null> {
  try {
    console.log(`Looking up tenant ID for subdomain: ${subdomain}`);
    const { cookies } = await import("next/headers");
    const { createServerClient } = await import("@supabase/ssr");
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Server components can't set cookies
          },
          remove(name: string, options: CookieOptions) {
            // Server components can't remove cookies
          },
        },
      },
    );

    const { data, error } = await supabase
      .from("Tenant")
      .select("id")
      .eq("subdomain", subdomain)
      .single();

    if (error || !data) {
      console.warn(`No tenant found for subdomain: ${subdomain}`, error);
      return null;
    }

    console.log(`Found tenant ID ${data.id} for subdomain ${subdomain}`);
    return data.id;
  } catch (error) {
    console.error("Error in getTenantIdBySubdomain:", error);
    return null;
  }
}

/**
 * Get tenant ID from request headers in API routes
 */
export function getCurrentTenantId(request?: Request): string {
  if (!request) {
    return DEFAULT_TENANT_ID;
  }
  const tenantId = request.headers.get("x-tenant-id");
  return tenantId || DEFAULT_TENANT_ID;
}

/**
 * Gets the current tenant ID for the session
 * This is only available server-side
 * @server-only
 */
export async function currentTenant(): Promise<string> {
  try {
    // Dynamic import to avoid importing on client side
    const { cookies } = await import("next/headers");
    const { createServerClient } = await import("@supabase/ssr");
    const cookieStore = cookies();

    // Try to get the tenant from cookies
    const tenantId =
      cookieStore.get("currentTenantId")?.value ||
      cookieStore.get("admin-tenant-id")?.value;

    if (tenantId) {
      return tenantId;
    }

    // Try to get from user metadata
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Server components can't set cookies
          },
          remove(name: string, options: CookieOptions) {
            // Server components can't remove cookies
          },
        },
      },
    );
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.user_metadata?.currentTenantId) {
      return session.user.user_metadata.currentTenantId;
    }

    return DEFAULT_TENANT_ID;
  } catch (error) {
    console.error("Error getting current tenant:", error);
    return DEFAULT_TENANT_ID;
  }
}

/**
 * Get the subdomain for a tenant ID
 * @server-only
 */
export async function getSubdomainForTenant(
  tenantId: string,
): Promise<string | null> {
  try {
    console.log(`Looking up subdomain for tenant ID: ${tenantId}`);
    const { cookies } = await import("next/headers");
    const { createServerClient } = await import("@supabase/ssr");
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Server components can't set cookies
          },
          remove(name: string, options: CookieOptions) {
            // Server components can't remove cookies
          },
        },
      },
    );

    const { data, error } = await supabase
      .from("Tenant")
      .select("subdomain")
      .eq("id", tenantId)
      .single();

    if (error || !data) {
      console.warn(`No subdomain found for tenant ID: ${tenantId}`, error);
      return null;
    }

    console.log(`Found subdomain ${data.subdomain} for tenant ID ${tenantId}`);
    return data.subdomain;
  } catch (error) {
    console.error("Error in getSubdomainForTenant:", error);
    return null;
  }
}

/**
 * Helper to enforce tenantId filtering on tenant-scoped tables
 * Usage: tenantQuery(client, 'Booking', tenantId).select(...)
 */
export function tenantQuery<T extends keyof Database["public"]["Tables"]>(
  client: any,
  table: T,
  tenantId: string,
) {
  return client.from(table).eq("tenantId", tenantId);
}
