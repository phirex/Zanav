import { createAdminHandlerWithAuth } from "@/lib/apiHandler";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type PlanTier = "standard" | "pro";

async function readPlan(client: SupabaseClient<Database>, tenantId: string) {
  const { data: tenant } = await client
    .from("Tenant")
    .select("createdAt")
    .eq("id", tenantId)
    .maybeSingle();

  const { data: settingsRows } = await client
    .from("Setting")
    .select("key,value")
    .eq("tenantId", tenantId);
  const settings = new Map(
    (settingsRows || []).map((r: any) => [r.key, r.value]),
  );
  const plan = (settings.get("plan") as PlanTier) || "standard";
  const planForced = settings.get("plan_forced") === "true";
  return { plan, planForced, tenantCreatedAt: tenant?.createdAt || null };
}

export const GET = createAdminHandlerWithAuth(async ({ client, params }) => {
  const tenantId = Array.isArray(params?.tenantId)
    ? params?.tenantId[0]
    : params?.tenantId;
  if (!tenantId) return { error: "tenantId required" };
  const state = await readPlan(client, tenantId);
  return state;
});

export const PUT = createAdminHandlerWithAuth(
  async ({ client, params, body }) => {
    const tenantId = Array.isArray(params?.tenantId)
      ? params?.tenantId[0]
      : params?.tenantId;
    if (!tenantId) return { error: "tenantId required" };

    const plan = (body?.plan as PlanTier) || null;
    const planForced: boolean = body?.planForced === true;
    if (!plan || (plan !== "standard" && plan !== "pro")) {
      return { error: "Invalid plan. Use 'standard' or 'pro'" };
    }

    const rows: Array<{ tenantId: string; key: string; value: string }> = [
      { tenantId, key: "plan", value: plan },
      { tenantId, key: "plan_forced", value: planForced ? "true" : "false" },
    ];
    await client.from("Setting").upsert(rows, { onConflict: "tenantId,key" });
    const state = await readPlan(client, tenantId);
    return { success: true, ...state };
  },
);
