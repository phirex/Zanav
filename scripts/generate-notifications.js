const { PrismaClient } = require("@prisma/client");
const { format } = require("date-fns");
const prisma = new PrismaClient();

// Helper function to format phone number to international format
function formatPhoneNumber(phone) {
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

async function scheduleNotificationsForBooking(bookingId, triggerType) {
  try {
    console.log(
      `Scheduling ${triggerType} notifications for booking ${bookingId}`,
    );

    // Get the booking with all necessary relations
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        dog: true,
        owner: true,
        room: true,
      },
    });

    if (!booking) {
      console.error(`Booking ${bookingId} not found`);
      return;
    }

    console.log(
      `Found booking for ${booking.dog.name}, status: ${booking.status}`,
    );

    // Find all active templates matching the trigger type
    const templates = await prisma.notificationTemplate.findMany({
      where: {
        trigger: triggerType,
        active: true,
      },
    });

    if (templates.length === 0) {
      console.log(`No active templates found for trigger ${triggerType}`);
      return;
    }

    console.log(
      `Found ${templates.length} templates for trigger ${triggerType}`,
    );

    // Format dates for template variables
    const startDate = format(new Date(booking.startDate), "dd/MM/yyyy");
    const endDate = format(new Date(booking.endDate), "dd/MM/yyyy");

    // Format time for template variables
    const startTime = format(new Date(booking.startDate), "HH:mm");

    // Format phone number
    const phoneNumber = formatPhoneNumber(booking.owner.phone);
    console.log(`Phone number: ${booking.owner.phone} -> ${phoneNumber}`);

    // Prepare variables
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

    const now = new Date();
    const startDateObj = new Date(booking.startDate);
    const endDateObj = new Date(booking.endDate);

    let scheduledNotifications = 0;

    // Schedule notifications for each template
    for (const template of templates) {
      console.log(
        `Processing template: ${template.name}, delay: ${template.delayHours} hours`,
      );

      // Calculate when to send this notification
      let scheduledFor;
      let shouldSchedule = true;

      if (triggerType === "BOOKING_CONFIRMATION") {
        // For booking confirmations, schedule from now
        scheduledFor = new Date();
        // If delay is set, add it to the scheduled time
        if (template.delayHours > 0) {
          scheduledFor = new Date(
            scheduledFor.getTime() + template.delayHours * 60 * 60 * 1000,
          );
        }
      } else if (triggerType === "CHECK_IN_REMINDER") {
        // For check-in reminders, schedule relative to booking start date
        scheduledFor = new Date(
          startDateObj.getTime() - template.delayHours * 60 * 60 * 1000,
        );

        // Only schedule if the time is still in the future
        if (scheduledFor <= now) {
          console.log(
            `Skipping - scheduled time ${scheduledFor.toISOString()} is in the past`,
          );

          // For past check-in reminders, create a "sent" record if the booking start date is still in the future
          if (startDateObj > now) {
            console.log(
              "Creating a sent notification record for past reminder",
            );
            shouldSchedule = true;
            scheduledFor = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
          } else {
            shouldSchedule = false;
          }
        }
      } else if (triggerType === "CHECK_OUT_REMINDER") {
        // For check-out reminders, schedule relative to booking end date
        scheduledFor = new Date(
          endDateObj.getTime() - template.delayHours * 60 * 60 * 1000,
        );

        // Only schedule if the time is still in the future
        if (scheduledFor <= now) {
          console.log(
            `Skipping - scheduled time ${scheduledFor.toISOString()} is in the past`,
          );
          shouldSchedule = false;
        }
      } else {
        // Default - schedule from now
        scheduledFor = new Date(
          now.getTime() + template.delayHours * 60 * 60 * 1000,
        );
      }

      if (shouldSchedule) {
        console.log(
          `Creating notification scheduled for ${scheduledFor.toISOString()}`,
        );

        // For past reminders, mark as sent
        const isSent = scheduledFor <= now;

        // Create the scheduled notification
        await prisma.scheduledNotification.create({
          data: {
            templateId: template.id,
            bookingId: booking.id,
            scheduledFor,
            variables: baseVariables,
            recipient: phoneNumber,
            sent: isSent,
            sentAt: isSent ? now : null,
          },
        });

        scheduledNotifications++;
        console.log(
          `Created ${isSent ? "sent" : "pending"} notification with template ${template.name}`,
        );
      }
    }

    return scheduledNotifications;
  } catch (error) {
    console.error("Error scheduling notifications:", error);
  }
}

async function main() {
  try {
    // Get all confirmed bookings
    const confirmedBookings = await prisma.booking.findMany({
      where: { status: "CONFIRMED" },
      select: { id: true },
    });

    console.log(`Found ${confirmedBookings.length} confirmed bookings`);

    let totalNotifications = 0;

    // For each booking, schedule various notification types
    for (const booking of confirmedBookings) {
      console.log(`\nProcessing booking ${booking.id}:`);

      // Schedule booking confirmation notifications
      const confirmations = await scheduleNotificationsForBooking(
        booking.id,
        "BOOKING_CONFIRMATION",
      );
      totalNotifications += confirmations || 0;

      // Schedule check-in reminders
      const checkInReminders = await scheduleNotificationsForBooking(
        booking.id,
        "CHECK_IN_REMINDER",
      );
      totalNotifications += checkInReminders || 0;

      // Schedule check-out reminders
      const checkOutReminders = await scheduleNotificationsForBooking(
        booking.id,
        "CHECK_OUT_REMINDER",
      );
      totalNotifications += checkOutReminders || 0;
    }

    console.log(
      `\nCreated ${totalNotifications} notifications for existing bookings`,
    );
  } catch (error) {
    console.error("Error generating notifications:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
