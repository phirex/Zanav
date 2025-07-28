import { createHandler } from "@/lib/apiHandler";
import { currentTenant } from "@/lib/tenant";
import {
  getTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/services/notificationTemplates";
import { ApiError } from "@/lib/apiHandler";
export { dynamic } from "@/lib/forceDynamic";

// GET /api/notification-templates/[id] - Get a notification template by ID
export const GET = createHandler(async ({ client, params }) => {
  const tenantId = await currentTenant();
  const idParam = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  if (!idParam) throw new ApiError("missing_id", "id required");
  return await getTemplate(client, tenantId, idParam);
});

// PUT /api/notification-templates/[id] - Update a notification template
export const PUT = createHandler(async ({ client, params, body }) => {
  const tenantId = await currentTenant();
  const idParam = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  if (!idParam) throw new ApiError("missing_id", "id required");
  return await updateTemplate(client, tenantId, idParam, body);
});

// DELETE /api/notification-templates/[id] - Delete a notification template
export const DELETE = createHandler(async ({ client, params }) => {
  const tenantId = await currentTenant();
  const idParam = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  if (!idParam) throw new ApiError("missing_id", "id required");
  return await deleteTemplate(client, tenantId, idParam);
});
