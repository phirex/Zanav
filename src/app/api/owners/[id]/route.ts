import { createHandler } from "@/lib/apiHandler";
import { getOwner } from "@/services/owners";
import { ApiError } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createHandler(async ({ params, tenantId }) => {
  const id = Number(params?.id);
  if (Number.isNaN(id)) throw new ApiError("invalid_owner_id", "Invalid owner id");
  if (!tenantId) throw new ApiError("missing_tenant", "No tenant found");

  const adminClient = supabaseAdmin();
  return await getOwner(adminClient, id, tenantId);
});
