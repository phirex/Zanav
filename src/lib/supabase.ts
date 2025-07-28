import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// Use the properly typed Database interface
export type SupabaseDatabase = Database;

/**
 * Returns a Supabase client configured for server-side usage **with the anon key** so that
 * Row-Level-Security rules are enforced. Use `supabaseAdmin()` when you intentionally need
 * service-role privileges.
 */
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error("Missing Supabase credentials:", {
      url: url ? "Defined" : "Missing",
      anonKey: anonKey ? "Defined" : "Missing",
    });
    throw new Error(
      "Supabase configuration error: Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables",
    );
  }

  try {
    return createClient<SupabaseDatabase>(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    throw new Error("Failed to initialize Supabase client");
  }
}

/**
 * Service-role client. ONLY use in admin/cron contexts where bypassing RLS is required.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Missing Supabase admin credentials:", {
      url: url ? "Defined" : "Missing",
      serviceKey: serviceKey ? "Defined" : "Missing",
    });
    throw new Error(
      "Supabase configuration error: Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables",
    );
  }

  return createClient<SupabaseDatabase>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
