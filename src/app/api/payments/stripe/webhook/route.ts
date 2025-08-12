import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/payments/stripe";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ ok: true });

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(raw, sig!, secret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "payment_intent.succeeded":
    case "charge.refunded":
    default:
      break;
  }
  return NextResponse.json({ received: true });
}
export const config = { api: { bodyParser: false } } as any;
