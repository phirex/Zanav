const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
  try {
    // First, check if templates exist
    const templates = await prisma.notificationTemplate.findMany();
    console.log(
      "Found templates:",
      templates.map((t) => t.name),
    );

    // Get bookings
    const bookings = await prisma.booking.findMany({
      where: { status: "CONFIRMED" },
      take: 1,
      include: { dog: true, owner: true, room: true },
    });
    console.log("Found booking:", bookings[0].id);

    // Try creating a notification
    const notification = await prisma.scheduledNotification.create({
      data: {
        templateId: templates[0].id,
        bookingId: bookings[0].id,
        scheduledFor: new Date(),
        variables: { test: "value" },
        recipient: "+123456789",
        sent: false,
      },
    });

    console.log("Created notification:", notification.id);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
