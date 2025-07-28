import { NextRequest, NextResponse } from "next/server";
import { NotificationWorker } from "@/lib/services/notification-worker";
import { ApiError } from "@/lib/apiHandler";

export { dynamic } from "@/lib/forceDynamic";

// This API route will be triggered by a cron job to process pending notifications
export async function GET(request: NextRequest) {
  try {
    // Check for API key for secure access
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.CRON_API_KEY;

    // Basic security check
    if (
      apiKey &&
      (!authHeader ||
        !authHeader.startsWith("Bearer ") ||
        authHeader.split(" ")[1] !== apiKey)
    ) {
      console.error("Unauthorized access attempt to notifications cron job");
      throw new ApiError("unauthorized", "Unauthorized");
    }

    console.log("Starting scheduled notification processing");

    // Initialize the worker
    const worker = new NotificationWorker();

    // Process pending notifications
    await worker.processNotifications();

    return NextResponse.json({
      success: true,
      message: "Notification processing completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in notifications cron job:", error);
    return NextResponse.json(
      { error: "Failed to process notifications" },
      { status: 500 },
    );
  }
}
