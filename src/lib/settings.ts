import { supabaseServer } from "@/lib/supabase";
import { headers } from "next/headers";
import { DEFAULT_TENANT_ID } from "./tenant";

/**
 * Get the current tenant ID from headers
 */
function getCurrentTenantId(): string {
  try {
    const headersList = headers();
    const tenantId = headersList.get("x-tenant-id");
    console.log(`Current tenant ID from headers: ${tenantId || "not found"}`);
    return tenantId || DEFAULT_TENANT_ID;
  } catch (error) {
    console.error("Error getting tenant ID from headers:", error);
    return DEFAULT_TENANT_ID;
  }
}

/**
 * Get a setting value by key
 * @param key The setting key
 * @param tenantId Optional specific tenant ID to use
 * @returns The setting value as a string, or null if the setting doesn't exist
 */
export async function getSetting(
  key: string,
  tenantId?: string,
): Promise<string | null> {
  try {
    const supabase = supabaseServer();
    // Use provided tenant ID or get from headers
    const effectiveTenantId = tenantId || getCurrentTenantId();
    console.log(`Getting setting ${key} for tenant ${effectiveTenantId}`);
    // Remove set_tenant_context usage
    const { data, error } = await supabase
      .from("Setting")
      .select("value")
      .eq("key", key)
      .eq("tenantId", effectiveTenantId)
      .single();
    if (error) {
      if (error.code === "PGRST116") {
        console.log(`Setting ${key} not found for tenant ${effectiveTenantId}`);
        return null;
      }
      throw error;
    }
    console.log(
      `Found setting ${key}=${data?.value} for tenant ${effectiveTenantId}`,
    );
    return data?.value ?? null;
  } catch (error) {
    console.error(`Error retrieving setting ${key}:`, error);
    return null;
  }
}

/**
 * Update a setting value
 * @param key The setting key
 * @param value The new setting value
 * @param tenantId Optional specific tenant ID to use
 * @returns true if the setting was updated successfully, false otherwise
 */
export async function updateSetting(
  key: string,
  value: string,
  tenantId?: string,
): Promise<boolean> {
  try {
    const supabase = supabaseServer();
    // Use provided tenant ID or get from headers
    const effectiveTenantId = tenantId || getCurrentTenantId();
    console.log(
      `Updating setting ${key}=${value} for tenant ${effectiveTenantId}`,
    );
    // Remove set_tenant_context usage
    const { error } = await supabase.from("Setting").upsert(
      {
        key,
        value,
        tenantId: effectiveTenantId,
      },
      {
        onConflict: "tenantId,key",
      },
    );
    if (error) throw error;
    console.log(
      `Successfully updated setting ${key} for tenant ${effectiveTenantId}`,
    );
    return true;
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    return false;
  }
}

/**
 * Get all settings as a key-value object
 * @param tenantId Optional specific tenant ID to use
 * @returns An object with all settings
 */
export async function getAllSettings(
  tenantId?: string,
): Promise<Record<string, string>> {
  try {
    const supabase = supabaseServer();
    // Use provided tenant ID or get from headers
    const effectiveTenantId = tenantId || getCurrentTenantId();
    console.log(`Getting all settings for tenant ${effectiveTenantId}`);
    // Remove set_tenant_context usage
    const { data, error } = await supabase
      .from("Setting")
      .select("*")
      .eq("tenantId", effectiveTenantId);
    if (error) throw error;
    const obj: Record<string, string> = {};
    for (const row of data ?? []) {
      obj[row.key] = row.value;
    }
    console.log(
      `Found ${Object.keys(obj).length} settings for tenant ${effectiveTenantId}`,
    );
    return obj;
  } catch (error) {
    console.error("Error retrieving all settings:", error);
    return {};
  }
}
