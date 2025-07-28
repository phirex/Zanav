import { createHandler } from "@/lib/apiHandler";
import { resetExemptLastDayPrices } from "@/services/bookings";
export { dynamic } from "@/lib/forceDynamic";

export const POST = createHandler(async ({ client }) => {
  const res = await resetExemptLastDayPrices(client);
  return {
    success: true,
    message: `Updated ${res.updatedCount} bookings and recalculated ${res.updatedPriceCount}`,
    ...res,
  };
});
