import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) stripeClient = new Stripe(key, { apiVersion: "2023-10-16" });
  return stripeClient;
}

export function platformFeeAmountCents(amountCents: number, bps = 500, min = 50, cap = 1500) {
  const pct = Math.round((amountCents * bps) / 10000);
  return Math.max(Math.min(pct, cap), min);
}
