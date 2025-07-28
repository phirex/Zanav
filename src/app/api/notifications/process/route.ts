import { createHandler } from "@/lib/apiHandler";
export { dynamic } from "@/lib/forceDynamic";
import { processScheduledNotifications } from "@/services/notifications";

// POST /api/notifications/process - Process pending notifications
export const POST = createHandler(async ({ client }) => {
  return await processScheduledNotifications(client);
});
