const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    // Count all notifications
    const totalCount = await prisma.scheduledNotification.count();
    console.log(`Total notifications: ${totalCount}`);

    // Check for sent notifications
    const sentCount = await prisma.scheduledNotification.count({
      where: { sent: true },
    });
    console.log(`Sent notifications: ${sentCount}`);

    // Check for pending notifications
    const pendingCount = await prisma.scheduledNotification.count({
      where: { sent: false },
    });
    console.log(`Pending notifications: ${pendingCount}`);

    // Check notifications per trigger type
    const templates = await prisma.notificationTemplate.findMany();
    console.log("\nAvailable templates:");
    for (const template of templates) {
      console.log(
        `- ${template.name} (${template.trigger}, delay: ${template.delayHours}h, active: ${template.active})`,
      );

      const notificationCount = await prisma.scheduledNotification.count({
        where: { templateId: template.id },
      });
      console.log(`  Notifications using this template: ${notificationCount}`);
    }

    // Check confirmed bookings without notifications
    const confirmedBookingsCount = await prisma.booking.count({
      where: { status: "CONFIRMED" },
    });
    console.log(`\nConfirmed bookings: ${confirmedBookingsCount}`);

    const bookingsWithNotifications = await prisma.booking.count({
      where: {
        status: "CONFIRMED",
        scheduledNotifications: {
          some: {},
        },
      },
    });
    console.log(
      `Confirmed bookings with notifications: ${bookingsWithNotifications}`,
    );
    console.log(
      `Confirmed bookings without notifications: ${confirmedBookingsCount - bookingsWithNotifications}`,
    );

    // Show some example notifications if they exist
    if (totalCount > 0) {
      const sampleNotifications = await prisma.scheduledNotification.findMany({
        take: 3,
        include: {
          template: true,
          booking: {
            include: {
              dog: true,
              owner: true,
            },
          },
        },
      });

      console.log("\nSample notifications:");
      for (const notification of sampleNotifications) {
        console.log(`- ID: ${notification.id}`);
        console.log(
          `  Template: ${notification.template.name} (${notification.template.trigger})`,
        );
        console.log(
          `  Booking: ${notification.booking.id} for ${notification.booking.dog.name}`,
        );
        console.log(`  Scheduled for: ${notification.scheduledFor}`);
        console.log(`  Sent: ${notification.sent ? "Yes" : "No"}`);
        console.log(`  Recipient: ${notification.recipient}`);
        console.log("---");
      }
    }
  } catch (error) {
    console.error("Error checking notifications:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
