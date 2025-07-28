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

  // Remove set_tenant RPC call; rely on explicit tenantId filtering
  // try {
  //   await client.rpc("set_tenant", { _tenant_id: tenantId });
  // } catch (rpcError: any) {
  //   console.error("[listSettings] RPC error:", rpcError);
  //   // Don't throw here - try to proceed without RLS context
  // }

  const { data, error } = await client
    .from("Setting")
    .select("key, value")
    .eq("tenantId", tenantId);

  if (error) {
    console.error("[listSettings] Database error:", error);

    // Handle specific error cases gracefully
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

  // Remove set_tenant RPC call in updateSettings
  // try {
  //   await client.rpc("set_tenant", { _tenant_id: tenantId });
  // } catch (rpcError: any) {
  //   console.error("[updateSettings] RPC error:", rpcError);
  //   throw new Error(`Failed to set tenant context: ${rpcError?.message || rpcError}`);
  // }

  const entries = Object.entries(payload);
  const now = new Date().toISOString();
  const rows = entries.map(([key, value]) => ({
    key,
    value: value?.toString() || "",
    tenantId,
    updatedAt: now,
    createdAt: now,
  }));
  const { error } = await client.from("Setting").upsert(rows, {
    onConflict: "tenantId,key",
    ignoreDuplicates: false,
  });
  if (error) throw new Error(error.message);
  return { success: true };
}
