import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";
import { listUnpaidBookings } from "@/services/bookings";

export const GET = createHandler(async ({ tenantId }) => {
  const adminClient = supabaseAdmin();
  return await listUnpaidBookings(adminClient, tenantId);
});
