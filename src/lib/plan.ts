import { supabaseServer } from "./supabase/server";

export type PlanTier = "trial" | "standard" | "pro";

export interface PlanInfo {
  plan: Exclude<PlanTier, "trial">; // selected paid tier once trial ends
  isTrial: boolean;
  trialEndsAt: string; // ISO
  graceEndsAt: string; // ISO (7 days after trial)
  effectiveTier: PlanTier; // trial | standard | pro (trial overrides)
  limits: {
    maxStaffUsers: number | null;
    maxRooms: number | null;
    maxActiveTemplates: number | null;
    storageGb: number | null;
    features: {
      whatsapp: boolean;
      customDomain: boolean;
      reportsAdvanced: boolean;
      api: boolean;
      paymentsStripe: boolean;
    };
  };
}

const TRIAL_DAYS = 30;
const GRACE_DAYS = 7;

export async function getPlanInfo(tenantId: string): Promise<PlanInfo> {
  const supabase = supabaseServer();

  // Fetch tenant to compute trial window
  const { data: tenant } = await supabase
    .from("Tenant")
    .select("createdAt")
    .eq("id", tenantId)
    .single();

  const createdAt = tenant?.createdAt ? new Date(tenant.createdAt) : new Date();
  const trialEnds = new Date(createdAt);
  trialEnds.setDate(trialEnds.getDate() + TRIAL_DAYS);
  const graceEnds = new Date(trialEnds);
  graceEnds.setDate(graceEnds.getDate() + GRACE_DAYS);

  // Read selected plan from settings (defaults to standard)
  const { data: settingsRows } = await supabase
    .from("Setting")
    .select("key,value")
    .eq("tenantId", tenantId);
  const settings = new Map(
    (settingsRows || []).map((r: any) => [r.key, r.value]),
  );
  const selectedPlan = (settings.get("plan") as PlanInfo["plan"]) || "standard";

  const isTrial = new Date() < trialEnds;
  const effectiveTier: PlanTier = isTrial ? "trial" : selectedPlan;

  const limitsByTier = (tier: PlanTier) => {
    if (tier === "trial") {
      return {
        maxStaffUsers: null,
        maxRooms: null,
        maxActiveTemplates: null,
        storageGb: null,
        features: {
          whatsapp: true,
          customDomain: true,
          reportsAdvanced: true,
          api: true,
          paymentsStripe: true,
        },
      } as PlanInfo["limits"];
    }
    if (tier === "pro") {
      return {
        maxStaffUsers: null,
        maxRooms: null,
        maxActiveTemplates: null,
        storageGb: 10,
        features: {
          whatsapp: true,
          customDomain: true,
          reportsAdvanced: true,
          api: true,
          paymentsStripe: true,
        },
      } as PlanInfo["limits"];
    }
    // standard
    return {
      maxStaffUsers: 3,
      maxRooms: 5,
      maxActiveTemplates: 5,
      storageGb: 1,
      features: {
        whatsapp: false,
        customDomain: false,
        reportsAdvanced: false,
        api: false,
        paymentsStripe: false,
      },
    } as PlanInfo["limits"];
  };

  return {
    plan: selectedPlan,
    isTrial,
    trialEndsAt: trialEnds.toISOString(),
    graceEndsAt: graceEnds.toISOString(),
    effectiveTier,
    limits: limitsByTier(effectiveTier),
  };
}

export async function assertRoomCreationAllowed(
  tenantId: string,
): Promise<void> {
  const info = await getPlanInfo(tenantId);
  // Unlimited on trial or pro
  if (info.effectiveTier === "trial" || info.effectiveTier === "pro") return;
  const max = info.limits.maxRooms;
  if (!max) return;

  const supabase = supabaseServer();
  const { count } = await supabase
    .from("Room")
    .select("id", { count: "exact", head: true })
    .eq("tenantId", tenantId);
  if ((count || 0) >= max) {
    const message = `Room limit reached for Standard plan (${max}). Upgrade to Pro to add more rooms.`;
    const error: any = new Error(message);
    error.code = "limit_exceeded";
    throw error;
  }
}
