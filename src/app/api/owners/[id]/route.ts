import { createHandler } from "@/lib/apiHandler";
import { getOwner } from "@/services/owners";
import { ApiError } from "@/lib/apiHandler";

export const GET = createHandler(async ({ params, client, tenantId }) => {
  const id = Number(params?.id);
  if (Number.isNaN(id))
    throw new ApiError("invalid_owner_id", "Invalid owner id");
  return await getOwner(client, id, tenantId);
});
