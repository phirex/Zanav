#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// This script creates a test notification for immediate delivery

async function main() {
  try {
    console.log("Creating test notification...");

    // Find an active booking
    const booking = await prisma.booking.findFirst({
      where: {
        status: "CONFIRMED",
      },
      include: {
        dog: true,
        owner: true,
        room: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    if (!booking) {
      console.error("No confirmed booking found");
      return;
    }

    console.log(`Found booking ${booking.id} for ${booking.dog.name}`);

    // Find the booking confirmation template
    const template = await prisma.notificationTemplate.findFirst({
      where: {
        trigger: "BOOKING_CONFIRMATION",
        active: true,
      },
    });

    if (!template) {
      console.error("No active booking confirmation template found");
      return;
    }

    console.log(`Found template: ${template.name}`);

    // Format phone number
    let phoneNumber = booking.owner.phone;
    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, "");

    // If starts with 0, replace with +972
    if (digitsOnly.startsWith("0")) {
      phoneNumber = "+972" + digitsOnly.substring(1);
    }
    // If already has country code
    else if (digitsOnly.startsWith("972")) {
      phoneNumber = "+" + digitsOnly;
    }
    // Default to adding +972 prefix
    else {
      phoneNumber = "+972" + digitsOnly;
    }

    console.log(
      `Formatted phone number: ${booking.owner.phone} -> ${phoneNumber}`,
    );

    // Prepare notification variables
    const variables = {
      firstName: booking.owner.name.split(" ")[0],
      fullName: booking.owner.name,
      petName: booking.dog.name,
      checkInDate: new Date(booking.startDate).toLocaleDateString("he-IL"),
      checkOutDate: new Date(booking.endDate).toLocaleDateString("he-IL"),
      checkInTime: new Date(booking.startDate).toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      roomName: booking.room.name,
      bookingId: booking.id.toString(),
    };

    // Create the scheduled notification (for immediate delivery)
    const scheduledFor = new Date();
    scheduledFor.setMinutes(scheduledFor.getMinutes() + 1); // Schedule for 1 minute from now

    const notification = await prisma.scheduledNotification.create({
      data: {
        templateId: template.id,
        bookingId: booking.id,
        scheduledFor,
        variables,
        recipient: phoneNumber,
        sent: false,
      },
    });

    console.log("Test notification created successfully!");
    console.log("Notification ID:", notification.id);
    console.log("Scheduled for:", scheduledFor.toISOString());
    console.log("Recipient:", phoneNumber);
    console.log("Template:", template.name);
    console.log("\nRun npm run whatsapp to send it");
  } catch (error) {
    console.error("Error creating test notification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
