#!/usr/bin/env node
import twilio from "twilio";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// This script directly sends WhatsApp messages using Twilio, bypassing Next.js APIs

async function main() {
  try {
    console.log("Starting direct WhatsApp sender...");

    // Get WhatsApp settings from database
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "whatsappAccountSid",
            "whatsappAuthToken",
            "whatsappPhoneNumber",
            "whatsappEnabled",
          ],
        },
      },
    });

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    // Check if WhatsApp is enabled
    const whatsappEnabled = settingsMap.whatsappEnabled === "true";
    if (!whatsappEnabled) {
      console.log("WhatsApp notifications are disabled in settings. Exiting.");
      return;
    }

    if (
      !settingsMap.whatsappAccountSid ||
      !settingsMap.whatsappAuthToken ||
      !settingsMap.whatsappPhoneNumber
    ) {
      console.error("WhatsApp settings not fully configured");
      return;
    }

    console.log("Found WhatsApp settings");
    console.log(
      "Account SID:",
      settingsMap.whatsappAccountSid.substring(0, 5) + "...",
    );
    console.log("From Number:", settingsMap.whatsappPhoneNumber);

    // Find pending notifications
    const pendingNotifications = await prisma.scheduledNotification.findMany({
      where: {
        sent: false,
        scheduledFor: {
          lte: new Date(),
        },
      },
      include: {
        template: true,
        booking: true,
      },
      orderBy: {
        scheduledFor: "asc",
      },
      take: 10,
    });

    console.log(`Found ${pendingNotifications.length} pending notifications`);

    if (pendingNotifications.length === 0) {
      console.log("No pending notifications found");
      return;
    }

    // Initialize Twilio client
    const client = twilio(
      settingsMap.whatsappAccountSid,
      settingsMap.whatsappAuthToken,
    );

    // Process each notification
    for (const notification of pendingNotifications) {
      console.log(`Processing notification ${notification.id}`);
      console.log(`Template: ${notification.template.name}`);
      console.log(`To: ${notification.recipient}`);

      // Process template variables
      let messageBody = notification.template.body;
      for (const [key, value] of Object.entries(notification.variables)) {
        const pattern = new RegExp(`{${key}}`, "g");
        messageBody = messageBody.replace(pattern, value);
      }

      console.log("Message body:");
      console.log(messageBody);

      try {
        // Increment attempt counter
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: {
            attempts: {
              increment: 1,
            },
            lastAttemptAt: new Date(),
          },
        });

        // Format WhatsApp numbers
        const fromWhatsApp = `whatsapp:${settingsMap.whatsappPhoneNumber}`;
        const toWhatsApp = `whatsapp:${notification.recipient}`;

        console.log(`Sending from ${fromWhatsApp} to ${toWhatsApp}`);

        // Send the message
        const message = await client.messages.create({
          body: messageBody,
          from: fromWhatsApp,
          to: toWhatsApp,
        });

        console.log(`Message sent successfully! SID: ${message.sid}`);

        // Mark as sent
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: {
            sent: true,
            sentAt: new Date(),
          },
        });
      } catch (error) {
        console.error("Error sending message:", error);

        // Update with error
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: {
            lastError: error.message || String(error),
          },
        });
      }
    }

    console.log("Notification processing completed");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
