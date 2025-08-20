import { NextRequest, NextResponse } from "next/server";
import { createHandler } from "@/lib/apiHandler";
import { getPlanInfo, PlanTier } from "@/lib/plan";
import { supabaseServer } from "@/lib/supabase/server";

export const GET = createHandler(async ({ tenantId }) => {
  if (!tenantId)
    return NextResponse.json({ error: "No tenant" }, { status: 400 });
  const info = await getPlanInfo(tenantId);
  return info;
});

export const PUT = createHandler(async ({ tenantId, body }) => {
  if (!tenantId)
    return NextResponse.json({ error: "No tenant" }, { status: 400 });

  const plan = (body?.plan as Exclude<PlanTier, "trial">) || null;
  if (!plan || (plan !== "standard" && plan !== "pro")) {
    return NextResponse.json(
      { error: "Invalid plan. Use 'standard' or 'pro'" },
      { status: 400 },
    );
  }

  const supabase = supabaseServer();
  await supabase.from("Setting").upsert(
    [
      { tenantId, key: "plan", value: plan },
      // Do not allow tenants to force bypass trial/grace from here
    ],
    { onConflict: "tenantId,key" },
  );

  const info = await getPlanInfo(tenantId);
  return info;
});
