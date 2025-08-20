import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/payments/stripe";
import { supabaseServer } from "@/lib/supabase/server";
import { assertFeatureEnabled } from "@/lib/plan";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe)
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 },
    );

  const supabase = supabaseServer();
  const headers = Object.fromEntries(req.headers.entries());
  const tenantId = headers["x-tenant-id"]; // our middleware provides this
  if (!tenantId)
    return NextResponse.json({ error: "Missing tenant" }, { status: 400 });

  // Plan gate: paymentsStripe feature
  await assertFeatureEnabled(tenantId, "paymentsStripe");

  // Load tenant settings
  const { data: settings } = await supabase
    .from("Setting")
    .select("key,value")
    .eq("tenantId", tenantId);
  const map = new Map((settings || []).map((r: any) => [r.key, r.value]));
  let accountId = map.get("stripe_account_id");

  if (!accountId) {
    const acct = await stripe.accounts.create({ type: "express" });
    accountId = acct.id;
    await supabase
      .from("Setting")
      .upsert(
        { tenantId, key: "stripe_account_id", value: accountId },
        { onConflict: "tenantId,key" },
      );
  }

  const origin =
    req.headers.get("origin") || `https://${req.headers.get("host")}`;
  const return_url = `${origin}/settings?stripe=connected`;
  const refresh_url = `${origin}/settings?stripe=retry`;

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url,
    return_url,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: link.url });
}
