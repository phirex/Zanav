import { getSetting } from "@/lib/settings";
import { supabaseServer } from "@/lib/supabase";
import { format } from "date-fns";
import { he } from "date-fns/locale";

/**
 * Service to schedule notifications based on booking events and templates
 */
export class NotificationScheduler {
  private tenantId: string | null;

  /**
   * Create a new NotificationScheduler instance
   * @param tenantId Optional tenant ID to use for database operations
   */
  constructor(tenantId: string | null = null) {
    this.tenantId = tenantId;
  }

  /**
   * Schedule all notification types for a booking
   * @param bookingId The ID of the booking
   */
  async scheduleBookingNotifications(bookingId: number): Promise<void> {
    try {
      // Schedule all types of notifications for this booking
      await this.scheduleNotificationsForBooking(
        bookingId,
        "BOOKING_CONFIRMATION",
      );
      await this.scheduleNotificationsForBooking(
        bookingId,
        "CHECK_IN_REMINDER",
      );
      await this.scheduleNotificationsForBooking(
        bookingId,
        "CHECK_OUT_REMINDER",
      );

      console.log(`All notifications scheduled for booking ${bookingId}`);
    } catch (error) {
      console.error("Error scheduling notifications batch:", error);
    }
  }

  /**
   * Schedule notifications for a booking based on available templates
   * @param bookingId The ID of the booking
   * @param triggerType The type of trigger that initiated this scheduling
   */
  async scheduleNotificationsForBooking(
    bookingId: number,
    triggerType:
      | "BOOKING_CONFIRMATION"
      | "BOOKING_REMINDER"
      | "CHECK_IN_REMINDER"
      | "CHECK_OUT_REMINDER"
      | "PAYMENT_REMINDER"
      | "CUSTOM",
  ): Promise<void> {
    try {
      console.log(
        `Scheduling notifications for booking ${bookingId} with trigger ${triggerType}`,
      );

      // Get WhatsApp enabled setting for this tenant
      const whatsappEnabled = await getSetting(
        "whatsappEnabled",
        this.tenantId || undefined,
      );
      console.log(
        `WhatsApp enabled setting for tenant ${this.tenantId}: ${whatsappEnabled}`,
      );

      // Treat missing setting as enabled by default
      if (whatsappEnabled === "false") {
        console.log(
          `WhatsApp notifications are disabled for tenant ${this.tenantId}. Skipping scheduling.`,
        );
        return;
      }

      const supabase = supabaseServer();

      // Remove set_tenant RPC call; rely on explicit tenantId filtering
      // if (this.tenantId) {
      //   await supabase.rpc("set_tenant", { _tenant_id: this.tenantId });
      // }

      // Get the booking with relations
      const { data: booking, error: bookingErr } = await supabase
        .from("Booking")
        .select("*, dog:Dog(*), owner:Owner(*), room:Room(*)")
        .eq("id", bookingId)
        .single();

      if (bookingErr) {
        console.error(`Error fetching booking ${bookingId}:`, bookingErr);
        return;
      }

      const { data: templates, error: templateErr } = await supabase
        .from("NotificationTemplate")
        .select("*")
        .eq("trigger", triggerType)
        .eq("active", true);

      if (templateErr || !templates) {
        console.error("Error fetching templates:", templateErr);
        return;
      }

      console.log(
        `Found ${templates.length} templates for trigger ${triggerType}`,
      );

      // Format dates for template variables - using Israel timezone and Hebrew locale
      const startDate = this.formatDateHebrew(new Date(booking.startDate));
      const endDate = this.formatDateHebrew(new Date(booking.endDate));

      // Format time for template variables - using Israel timezone
      const startTime = this.formatTimeHebrew(new Date(booking.startDate));

      // Format phone number
      const phoneNumber = this.formatPhoneNumber(booking.owner.phone);

      // Prepare base template variables
      const baseVariables = {
        firstName: booking.owner.name.split(" ")[0],
        fullName: booking.owner.name,
        petName: booking.dog.name,
        checkInDate: startDate,
        checkOutDate: endDate,
        checkInTime: startTime,
        roomName: booking.room.name,
        bookingId: bookingId.toString(),
      };

      // Schedule notifications for each template
      for (const template of templates) {
        // Calculate when to send this notification based on template's delayHours
        let scheduledFor: Date;

        if (triggerType === "BOOKING_CONFIRMATION") {
          // For booking confirmations, schedule relative to now
          scheduledFor = new Date();
          scheduledFor.setHours(scheduledFor.getHours() + template.delayHours);
        } else if (triggerType === "CHECK_IN_REMINDER") {
          // For check-in reminders, schedule relative to the booking start date
          scheduledFor = new Date(booking.startDate);
          scheduledFor.setHours(scheduledFor.getHours() - template.delayHours);
        } else if (triggerType === "CHECK_OUT_REMINDER") {
          // For check-out reminders, schedule relative to the booking end date
          scheduledFor = new Date(booking.endDate);
          scheduledFor.setHours(scheduledFor.getHours() - template.delayHours);
        } else {
          // Default - schedule from now
          scheduledFor = new Date();
          scheduledFor.setHours(scheduledFor.getHours() + template.delayHours);
        }

        // Only schedule if the send time is in the future
        if (scheduledFor <= new Date()) {
          // Special handling for immediate booking confirmations (delayHours = 0)
          if (
            triggerType === "BOOKING_CONFIRMATION" &&
            template.delayHours === 0
          ) {
            // For immediate booking confirmations, we'll schedule them 1 minute from now
            // to ensure they're in the future but still sent almost immediately
            scheduledFor = new Date();
            scheduledFor.setMinutes(scheduledFor.getMinutes() + 1);
            console.log(
              `Immediate booking confirmation detected, scheduling for ${scheduledFor.toISOString()}`,
            );
          } else {
            console.log(
              `Skipping template ${template.name} as scheduled time is in the past`,
            );
            continue;
          }
        }

        console.log(
          `Scheduling notification for template ${template.name} at ${scheduledFor.toISOString()}`,
        );

        try {
          // Create the scheduled notification
          await supabase.from("ScheduledNotification").insert({
            templateId: template.id,
            bookingId: booking.id,
            scheduledFor: scheduledFor.toISOString(),
            variables: baseVariables,
            recipient: phoneNumber,
            sent: false,
            tenantId: this.tenantId || booking.tenantId,
          });

          console.log(
            `Scheduled notification created for booking ${bookingId} with template ${template.name}`,
          );
        } catch (error) {
          console.error(
            `Error creating scheduled notification: ${error instanceof Error ? error.message : String(error)}`,
          );
          console.error("Notification data:", {
            templateId: template.id,
            bookingId: booking.id,
            scheduledFor: scheduledFor.toISOString(),
            phoneNumber,
          });
        }
      }
    } catch (error) {
      console.error("Error scheduling notifications:", error);
    }
  }

  /**
   * Format date to Hebrew format with Israel timezone
   */
  private formatDateHebrew(date: Date): string {
    // Adjust for Israel timezone (UTC+3)
    const israelDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    return format(israelDate, "dd/MM/yyyy", { locale: he });
  }

  /**
   * Format time to Hebrew format with Israel timezone
   */
  private formatTimeHebrew(date: Date): string {
    // Adjust for Israel timezone (UTC+3)
    const israelDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    return format(israelDate, "HH:mm", { locale: he });
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, "");

    // If starts with 0, replace with +972
    if (digitsOnly.startsWith("0")) {
      return "+972" + digitsOnly.substring(1);
    }

    // If already has country code
    if (digitsOnly.startsWith("972")) {
      return "+" + digitsOnly;
    }

    // Default to adding +972 prefix
    return "+972" + digitsOnly;
  }
}
