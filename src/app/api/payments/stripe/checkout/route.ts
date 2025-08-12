import { NextRequest, NextResponse } from "next/server";
import { getStripe, platformFeeAmountCents } from "@/lib/payments/stripe";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const body = await req.json().catch(() => null);
  const amount_cents = body?.amount_cents;
  const currency = (body?.currency || "usd").toLowerCase();
  const metadata = body?.metadata || {};
  if (!amount_cents || amount_cents <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const headers = Object.fromEntries(req.headers.entries());
  const tenantId = headers["x-tenant-id"];
  if (!tenantId) return NextResponse.json({ error: "Missing tenant" }, { status: 400 });

  const supabase = supabaseServer();
  const { data: rows } = await supabase
    .from("Setting")
    .select("key,value")
    .eq("tenantId", tenantId);
  const map = new Map((rows || []).map((r: any) => [r.key, r.value]));
  const accountId = map.get("stripe_account_id");
  const bps = parseInt(map.get("platform_fee_bps") || process.env.STRIPE_CONNECT_FEE_BPS || "500");
  const min = parseInt(map.get("min_fee_cents") || "50");
  const cap = parseInt(map.get("fee_cap_cents") || "1500");

  if (!accountId) return NextResponse.json({ error: "Stripe not connected" }, { status: 400 });

  const fee = platformFeeAmountCents(amount_cents, bps, min, cap);

  const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;
  const success_url = `${origin}/kennel?paid=1`;
  const cancel_url = `${origin}/kennel?canceled=1`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url,
    cancel_url,
    line_items: [
      {
        price_data: {
          currency,
          product_data: { name: metadata?.description || "Kennel Booking" },
          unit_amount: amount_cents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      transfer_data: { destination: accountId },
      application_fee_amount: fee,
      metadata: { ...metadata, tenantId },
    },
    metadata: { tenantId, ...metadata },
  });

  return NextResponse.json({ url: session.url });
}
