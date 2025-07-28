import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Use the properly typed Database interface
export type SupabaseDatabase = Database;

/**
 * Returns a Supabase client configured for server‑side usage.
 * Uses the service‑role key so it can bypass RLS policies when necessary.
 * Make sure you NEVER expose the service key in the browser!
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
    return createClient<Database>(url, anonKey, {
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

// Service-role client for admin tasks that must bypass RLS policies.
export function supabaseAdmin() {
  if (typeof window !== "undefined") {
    throw new Error(
      "supabaseAdmin() must not be called in the browser! This would expose the service-role key.",
    );
  }
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

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
