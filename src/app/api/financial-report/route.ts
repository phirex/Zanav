import { createHandler } from "@/lib/apiHandler";
import { financialReport } from "@/services/financialReport";
import { ApiError } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";
import { assertFeatureEnabled } from "@/lib/plan";

export { dynamic } from "@/lib/forceDynamic";

export const GET = createHandler(async ({ client, tenantId, req }) => {
  const url = new URL(req.url);
  const yearParam = url.searchParams.get("year");
  if (!yearParam) throw new ApiError("missing_year", "Year is required");
  const year = parseInt(yearParam, 10);
  if (isNaN(year)) throw new ApiError("invalid_year", "Invalid year");

  // Gate advanced reports by plan
  await assertFeatureEnabled(tenantId, "reportsAdvanced");

  console.log(
    "[FINANCIAL_REPORT_API] Using admin client for tenant:",
    tenantId,
  );
  const adminClient = supabaseAdmin();

  return await financialReport(adminClient, year, tenantId);
});
