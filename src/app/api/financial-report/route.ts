import { createHandler } from "@/lib/apiHandler";
import { financialReport } from "@/services/financialReport";
import { ApiError } from "@/lib/apiHandler";

export { dynamic } from "@/lib/forceDynamic";

export const GET = createHandler(async ({ client, tenantId, req }) => {
  const url = new URL(req.url);
  const yearParam = url.searchParams.get("year");
  if (!yearParam) throw new ApiError("missing_year", "Year is required");
  const year = parseInt(yearParam, 10);
  if (isNaN(year)) throw new ApiError("invalid_year", "Invalid year");

  return await financialReport(client, year, tenantId);
});
