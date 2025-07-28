import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { WhatsAppService } from "@/lib/services/whatsapp";

// POST /api/notifications/[id]/send - Send a specific notification
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const now = new Date();
    console.log(`Manually sending notification ${id} at ${now.toISOString()}`);

    const supabase = supabaseServer();

    // Find the specific notification
    const { data: notification, error: fetchError } = await supabase
      .from("ScheduledNotification")
      .select(
        `
        *,
        template:NotificationTemplate(*),
        booking:Booking(*,dog:Dog(*),owner:Owner(*))
      `,
      )
      .eq("id", id)
      .single();

    if (fetchError || !notification) {
      console.error(`Notification ${id} not found:`, fetchError);
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    console.log(
      `Found notification ${id} (template: ${notification.template.name})`,
    );

    // Skip notifications for cancelled bookings
    if (notification.booking.status === "CANCELLED") {
      console.log(`Skipping - booking ${notification.bookingId} is cancelled`);

      // Mark as sent to avoid processing again
      const { error: updateError } = await supabase
        .from("ScheduledNotification")
        .update({
          sent: true,
          sentAt: now.toISOString(),
          lastAttemptAt: now.toISOString(),
          lastError: "Booking cancelled",
        })
        .eq("id", id);

      if (updateError) {
        console.error(`Error updating notification ${id}:`, updateError);
        return NextResponse.json(
          { error: "Failed to update notification status" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: false,
        status: "skipped",
        reason: "booking_cancelled",
      });
    }

    try {
      // Initialize WhatsApp service
      const whatsappService = new WhatsAppService();

      // Send the message
      const result = await whatsappService.sendMessage({
        to: notification.recipient,
        template: notification.template.name,
        variables: notification.variables as Record<string, string>,
      });

      if (result.success) {
        console.log(
          `Successfully sent notification ${id} to ${notification.recipient}`,
        );

        // Mark as sent
        const { error: markSentError } = await supabase
          .from("ScheduledNotification")
          .update({
            sent: true,
            sentAt: now.toISOString(),
            lastAttemptAt: now.toISOString(),
            attempts: notification.attempts + 1,
          })
          .eq("id", id);

        if (markSentError) {
          console.error(
            `Error marking notification ${id} as sent:`,
            markSentError,
          );
          return NextResponse.json(
            { error: "Failed to update notification status" },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          status: "sent",
          messageId: result.messageId,
        });
      } else {
        console.error(`Failed to send notification ${id}: ${result.error}`);

        // Update with error
        const { error: errorUpdateError } = await supabase
          .from("ScheduledNotification")
          .update({
            lastError:
              typeof result.error === "string"
                ? result.error
                : JSON.stringify(result.error),
            lastAttemptAt: now.toISOString(),
            attempts: notification.attempts + 1,
          })
          .eq("id", id);

        if (errorUpdateError) {
          console.error(
            `Error updating notification ${id} with error:`,
            errorUpdateError,
          );
        }

        return NextResponse.json({
          success: false,
          status: "failed",
          error: result.error,
        });
      }
    } catch (error: any) {
      console.error(`Error processing notification ${id}:`, error);

      // Update with error
      await supabase
        .from("ScheduledNotification")
        .update({
          lastError: error.message || String(error),
          lastAttemptAt: now.toISOString(),
          attempts: notification.attempts + 1,
        })
        .eq("id", id);

      return NextResponse.json({
        success: false,
        status: "error",
        error: error.message || "Unknown error occurred",
      });
    }
  } catch (error: any) {
    console.error("Error processing manual notification send:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process notification" },
      { status: 500 },
    );
  }
}
