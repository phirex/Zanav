import { createHandler } from "@/lib/apiHandler";
import { currentTenant } from "@/lib/tenant";
import {
  listTemplates,
  createTemplate,
} from "@/services/notificationTemplates";
export { dynamic } from "@/lib/forceDynamic";

// GET /api/notification-templates - Get all notification templates
export const GET = createHandler(async ({ client }) => {
  const tenantId = await currentTenant();
  return await listTemplates(client, tenantId);
});

// POST /api/notification-templates - Create a new notification template
export const POST = createHandler(async ({ client, body }) => {
  const tenantId = await currentTenant();
  return await createTemplate(client, tenantId, body);
});
