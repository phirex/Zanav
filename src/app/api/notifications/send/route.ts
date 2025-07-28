import { createHandler } from "@/lib/apiHandler";
import { sendPendingNotifications } from "@/services/notifications";
export { dynamic } from "@/lib/forceDynamic";

// POST /api/notifications/send - Send pending notifications immediately
export const POST = createHandler(async ({ client }) => {
  return await sendPendingNotifications(client);
});
