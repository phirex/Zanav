import { createHandler } from "@/lib/apiHandler";
import { createPayment } from "@/services/payments";
export { dynamic } from "@/lib/forceDynamic";
import type { Database } from "@/lib/database.types";

type PaymentMethod = Database["public"]["Enums"]["PaymentMethod"];

// POST /api/payments - Create a payment
export const POST = createHandler(async ({ client, body }) => {
  const { bookingId, amount, method } = body;
  return await createPayment(client, {
    bookingId,
    amount,
    method: method as PaymentMethod,
  });
});
