const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Creates default notification templates if they don't exist
 */
async function createDefaultTemplates() {
  try {
    console.log("Checking for default notification templates...");

    // Default templates configuration
    const defaultTemplates = [
      {
        name: "Default Booking Confirmation",
        description: "Default template for booking confirmations",
        subject: "Booking Confirmation",
        body: "Hello {firstName},\n\nYour booking for {petName} has been confirmed!\n\nCheck-in: {checkInDate}\nCheck-out: {checkOutDate}\n\nBooking ID: {bookingId}\n\nThank you for choosing our service!",
        trigger: "BOOKING_CONFIRMATION",
        delayHours: 0,
        active: true,
      },
      {
        name: "Default Check-in Reminder 24h",
        description: "Reminder sent 24 hours before check-in",
        subject: "Check-in Reminder",
        body: "Hello {firstName},\n\nThis is a reminder that you have a booking for {petName} tomorrow.\n\nCheck-in: {checkInDate}\n\nWe look forward to seeing you!\n\nBooking ID: {bookingId}",
        trigger: "CHECK_IN_REMINDER",
        delayHours: 24,
        active: true,
      },
      {
        name: "Default Check-out Reminder",
        description: "Reminder sent 24 hours before check-out",
        subject: "Check-out Reminder",
        body: "Hello {firstName},\n\nThis is a reminder that your booking for {petName} will end tomorrow.\n\nCheck-out: {checkOutDate}\n\nThank you for choosing our service!\n\nBooking ID: {bookingId}",
        trigger: "CHECK_OUT_REMINDER",
        delayHours: 24,
        active: true,
      },
    ];

    // Check and create each default template
    for (const templateConfig of defaultTemplates) {
      // Check if template with this trigger already exists
      const existingTemplate = await prisma.notificationTemplate.findFirst({
        where: {
          trigger: templateConfig.trigger,
        },
      });

      if (existingTemplate) {
        console.log(
          `Template for ${templateConfig.trigger} already exists: ${existingTemplate.name}`,
        );

        // If it exists but is not active, ask if we should activate it
        if (!existingTemplate.active) {
          console.log(
            `Warning: The existing template for ${templateConfig.trigger} is not active.`,
          );
          console.log(
            `You may want to activate it or create a new active template.`,
          );
        }
        continue;
      }

      // Create the template if it doesn't exist
      const newTemplate = await prisma.notificationTemplate.create({
        data: templateConfig,
      });

      console.log(
        `Created new template: ${newTemplate.name} (${newTemplate.trigger})`,
      );
    }

    console.log("Default templates check completed.");
  } catch (error) {
    console.error("Error creating default templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createDefaultTemplates();
