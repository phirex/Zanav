import { WhatsAppService } from "./whatsapp";
import { supabaseServer } from "@/lib/supabase";

/**
 * Service to process scheduled notifications
 */
export class NotificationWorker {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  /**
   * Process all pending notifications that are due
   */
  async processNotifications(): Promise<void> {
    try {
      console.log("Looking for notifications to send...");

      const supabase = supabaseServer();

      const now = new Date();
      const { data: pendingNotifications, error } = await supabase
        .from("ScheduledNotification")
        .select(
          `*, template:NotificationTemplate(*), booking:Booking(*, dog:Dog(*), owner:Owner(*))`,
        )
        .eq("sent", false)
        .lte("scheduledFor", now.toISOString())
        .lt("attempts", 3)
        .order("scheduledFor", { ascending: true })
        .limit(10);

      if (error) {
        console.error("Error fetching pending notifications:", error);
        return;
      }

      if (pendingNotifications.length === 0) {
        console.log("No notifications pending to be sent");
        return;
      }

      console.log(`Found ${pendingNotifications.length} notifications to send`);

      // Process each notification
      for (const notification of pendingNotifications) {
        try {
          console.log(
            `Processing notification ${notification.id} for booking ${notification.bookingId}`,
          );

          // Skip if booking is cancelled
          if (
            notification.booking &&
            notification.booking.status === "CANCELLED"
          ) {
            console.log(
              `Skipping notification for cancelled booking ${notification.bookingId}`,
            );

            // Mark as sent to avoid processing again
            await supabase
              .from("ScheduledNotification")
              .update({
                sent: true,
                sentAt: now.toISOString(),
                lastAttemptAt: now.toISOString(),
                lastError: "Booking cancelled",
              })
              .eq("id", notification.id);

            continue;
          }

          // Send the WhatsApp message (template name equals trigger name in our setup)
          const result = await this.whatsappService.sendMessage({
            to: notification.recipient,
            template:
              notification.template.trigger || notification.template.name,
            variables: notification.variables as Record<string, string>,
          });

          if (result.success) {
            console.log(
              `Successfully sent notification ${notification.id}, message ID: ${result.messageId}`,
            );

            // Update notification status
            await supabase
              .from("ScheduledNotification")
              .update({
                sent: true,
                sentAt: now.toISOString(),
                lastAttemptAt: now.toISOString(),
              })
              .eq("id", notification.id);
          } else {
            console.error(
              `Failed to send notification ${notification.id}: ${result.error}`,
            );

            // Update attempt count
            await supabase
              .from("ScheduledNotification")
              .update({
                attempts: notification.attempts + 1,
                lastAttemptAt: now.toISOString(),
                lastError: result.error,
              })
              .eq("id", notification.id);
          }
        } catch (error) {
          console.error(
            `Error processing notification ${notification.id}:`,
            error,
          );

          // Update attempt count
          await supabase
            .from("ScheduledNotification")
            .update({
              attempts: notification.attempts + 1,
              lastAttemptAt: now.toISOString(),
              lastError:
                error instanceof Error ? error.message : "Unknown error",
            })
            .eq("id", notification.id);
        }

        // Small delay between sending messages to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error("Error in notification worker:", error);
    }
  }
}
