import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/payments/stripe";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ configured: false });

  const headers = Object.fromEntries(req.headers.entries());
  const tenantId = headers["x-tenant-id"];
  if (!tenantId) return NextResponse.json({ error: "Missing tenant" }, { status: 400 });

  const supabase = supabaseServer();
  const { data } = await supabase
    .from("Setting")
    .select("value")
    .eq("tenantId", tenantId)
    .eq("key", "stripe_account_id")
    .maybeSingle();

  const accountId = (data as any)?.value;
  if (!accountId) return NextResponse.json({ configured: true, connected: false });

  const acct = await stripe.accounts.retrieve(accountId);
  return NextResponse.json({ configured: true, connected: acct.charges_enabled, payouts_enabled: acct.payouts_enabled, accountId });
}
