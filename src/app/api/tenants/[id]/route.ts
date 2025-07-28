import { createHandler } from "@/lib/apiHandler";
import { getTenant } from "@/services/tenants";
import { ApiError } from "@/lib/apiHandler";

export const GET = createHandler(async ({ params, client }) => {
  const id = params?.id as string;
  if (!id) throw new ApiError("missing_tenant_id", "Tenant ID is required");
  return await getTenant(client, id);
});
