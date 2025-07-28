import { createHandler, ApiError } from "@/lib/apiHandler";
import { processScheduledNotifications } from "@/services/notifications";
export { dynamic } from "@/lib/forceDynamic";

// GET /api/notifications/process-public - Process pending notifications with public access
export const GET = createHandler(async ({ client, req }) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError("unauthorized", "Unauthorized");
  }
  const token = authHeader.substring(7);
  if (token !== process.env.NOTIFICATIONS_API_KEY) {
    throw new ApiError("invalid_token", "Invalid token");
  }

  return await processScheduledNotifications(client);
});
