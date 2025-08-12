import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

export async function listSettings(
  client: SupabaseClient<Database>,
  tenantId: string,
) {
  if (!tenantId) {
    console.warn(
      "[listSettings] No tenant ID provided, returning empty settings",
    );
    return {};
  }

  const { data, error } = await client
    .from("Setting")
    .select("key, value")
    .eq("tenantId", tenantId);

  if (error) {
    console.error("[listSettings] Database error:", error);

    if (error.code === "PGRST116" || error.message?.includes("not found")) {
      return {};
    }

    throw new Error(error.message);
  }

  const obj: Record<string, string> = {};
  data?.forEach((s) => {
    obj[s.key] = s.value;
  });

  return obj;
}

export async function updateSettings(
  client: SupabaseClient<Database>,
  tenantId: string,
  payload: Record<string, any>,
) {
  if (!tenantId) {
    throw new Error("Tenant ID is required for updating settings");
  }

  const now = new Date().toISOString();
  const entries = Object.entries(payload);

  for (const [key, rawValue] of entries) {
    const value = rawValue?.toString() ?? "";

    // Check if setting exists
    const { data: existing, error: fetchErr } = await client
      .from("Setting")
      .select("key")
      .eq("tenantId", tenantId)
      .eq("key", key)
      .maybeSingle();

    if (fetchErr && fetchErr.code !== "PGRST116") {
      console.error("[updateSettings] fetch existing failed:", fetchErr);
      throw new Error(fetchErr.message);
    }

    if (existing) {
      const { error: updErr } = await client
        .from("Setting")
        .update({ value, updatedAt: now })
        .eq("tenantId", tenantId)
        .eq("key", key);
      if (updErr) {
        console.error("[updateSettings] update failed:", updErr);
        throw new Error(updErr.message);
      }
    } else {
      const { error: insErr } = await client.from("Setting").insert({
        key,
        value,
        tenantId,
        createdAt: now,
        updatedAt: now,
      });
      if (insErr) {
        console.error("[updateSettings] insert failed:", insErr);
        throw new Error(insErr.message);
      }
    }
  }

  return { success: true };
}
