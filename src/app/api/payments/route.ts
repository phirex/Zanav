import { createHandler } from "@/lib/apiHandler";
import { createPayment } from "@/services/payments";
export { dynamic } from "@/lib/forceDynamic";
import { PaymentMethod } from "@/lib/supabase/types";

// POST /api/payments - Create a payment
export const POST = createHandler(async ({ client, body }) => {
  const { bookingId, amount, method } = body;
  return await createPayment(client, {
    bookingId,
    amount,
    method: method as PaymentMethod,
  });
});
