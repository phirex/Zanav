import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";
import { WhatsAppService } from "@/lib/services/whatsapp";

export async function sendPendingNotifications(
  client: SupabaseClient<Database>,
) {
  const now = new Date();
  const { data: pendingNotifications, error: fetchError } = await client
    .from("ScheduledNotification")
    .select(
      `*, template:NotificationTemplate(*), booking:Booking(*, dog:Dog(*), owner:Owner(*))`,
    )
    .eq("sent", false)
    .order("scheduledFor", { ascending: true })
    .limit(10);
  if (fetchError) throw new Error(fetchError.message);

  if (!pendingNotifications || pendingNotifications.length === 0) {
    return { processed: 0, results: [] };
  }

  const whatsappService = new WhatsAppService();
  const results: any[] = [];

  for (const notification of pendingNotifications) {
    try {
      const result = await whatsappService.sendMessage({
        to: notification.recipient,
        template: notification.template.name,
        variables: notification.variables as Record<string, string>,
      });

      if (result.success) {
        await client
          .from("ScheduledNotification")
          .update({
            sent: true,
            sentAt: now.toISOString(),
            lastAttemptAt: now.toISOString(),
            attempts: notification.attempts + 1,
          })
          .eq("id", notification.id);
        results.push({
          id: notification.id,
          status: "sent",
          messageId: result.messageId,
        });
      } else {
        await client
          .from("ScheduledNotification")
          .update({
            lastError:
              typeof result.error === "string"
                ? result.error
                : JSON.stringify(result.error),
            lastAttemptAt: now.toISOString(),
            attempts: notification.attempts + 1,
          })
          .eq("id", notification.id);
        results.push({
          id: notification.id,
          status: "failed",
          error: result.error,
        });
      }
    } catch (err: any) {
      await client
        .from("ScheduledNotification")
        .update({
          lastError: err.message || String(err),
          lastAttemptAt: now.toISOString(),
          attempts: notification.attempts + 1,
        })
        .eq("id", notification.id);
      results.push({
        id: notification.id,
        status: "error",
        error: err.message || String(err),
      });
    }
  }

  return { processed: results.length, results };
}

export async function processScheduledNotifications(
  client: SupabaseClient<Database>,
) {
  const now = new Date();
  const { data: pendingNotifications, error: fetchError } = await client
    .from("ScheduledNotification")
    .select(
      `*, template:NotificationTemplate(*), booking:Booking(*, dog:Dog(*), owner:Owner(*))`,
    )
    .eq("sent", false)
    .lte("scheduledFor", now.toISOString())
    .lt("attempts", 3)
    .order("scheduledFor", { ascending: true })
    .limit(10);
  if (fetchError) throw new Error(fetchError.message);

  if (!pendingNotifications || pendingNotifications.length === 0) {
    return { processed: 0, results: [] };
  }

  const whatsappService = new WhatsAppService();
  const results: any[] = [];

  for (const notification of pendingNotifications) {
    // Skip cancelled bookings
    if (notification.booking?.status === "CANCELLED") {
      await client
        .from("ScheduledNotification")
        .update({
          sent: true,
          sentAt: now.toISOString(),
          lastAttemptAt: now.toISOString(),
          lastError: "Booking cancelled",
        })
        .eq("id", notification.id);
      results.push({
        id: notification.id,
        status: "skipped",
        reason: "booking_cancelled",
      });
      continue;
    }

    // Increment attempts timestamp first
    await client
      .from("ScheduledNotification")
      .update({
        attempts: notification.attempts + 1,
        lastAttemptAt: now.toISOString(),
      })
      .eq("id", notification.id);

    try {
      const result = await whatsappService.sendMessage({
        to: notification.recipient,
        template: notification.template.name,
        variables: notification.variables as Record<string, string>,
      });

      if (result.success) {
        await client
          .from("ScheduledNotification")
          .update({ sent: true, sentAt: now.toISOString() })
          .eq("id", notification.id);
        results.push({
          id: notification.id,
          status: "sent",
          messageId: result.messageId,
        });
      } else {
        await client
          .from("ScheduledNotification")
          .update({
            lastError:
              typeof result.error === "string"
                ? result.error
                : JSON.stringify(result.error),
          })
          .eq("id", notification.id);
        results.push({
          id: notification.id,
          status: "failed",
          error: result.error,
        });
      }
    } catch (err: any) {
      await client
        .from("ScheduledNotification")
        .update({ lastError: err.message || String(err) })
        .eq("id", notification.id);
      results.push({
        id: notification.id,
        status: "error",
        error: err.message || String(err),
      });
    }
  }

  return { processed: results.length, results };
}
