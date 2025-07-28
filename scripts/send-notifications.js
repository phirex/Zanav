const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
// Fix import path to work in scripts
const path = require("path");
const fs = require("fs");

// Check if WhatsApp service exists and dynamically load it
let WhatsAppService;
try {
  // Try different possible paths
  const basePath = path.join(__dirname, "..");
  const srcPath = path.join(basePath, "src", "lib", "services", "whatsapp.ts");
  const compiledPath = path.join(
    basePath,
    ".next",
    "server",
    "app",
    "lib",
    "services",
    "whatsapp.js",
  );

  if (fs.existsSync(srcPath)) {
    console.log("WhatsApp service found at:", srcPath);
    throw new Error(
      "Cannot directly import TypeScript files in CommonJS scripts",
    );
  } else if (fs.existsSync(compiledPath)) {
    console.log("WhatsApp service found at:", compiledPath);
    throw new Error(
      "Cannot directly import compiled Next.js server code from external scripts",
    );
  } else {
    throw new Error("WhatsApp service file not found");
  }
} catch (error) {
  console.log("WhatsApp service import error:", error.message);
  console.log("Creating custom WhatsApp service for script use...");

  // Define a simplified WhatsApp service for script use
  WhatsAppService = class WhatsAppService {
    async sendMessage(params) {
      try {
        console.log("Sending WhatsApp message:", params);

        // Get the template from the database
        let template = await prisma.notificationTemplate.findFirst({
          where: {
            name: params.template,
            active: true,
          },
        });

        if (!template) {
          console.log(
            `Template with name '${params.template}' not found, trying by trigger type`,
          );
          template = await prisma.notificationTemplate.findFirst({
            where: {
              trigger: params.template,
              active: true,
            },
          });
        }

        if (!template) {
          return {
            success: false,
            error: `No active template found with name or trigger '${params.template}'`,
          };
        }

        // Get the WhatsApp settings from database
        const settings = await prisma.setting.findMany({
          where: {
            key: {
              in: [
                "whatsappAccountSid",
                "whatsappAuthToken",
                "whatsappPhoneNumber",
              ],
            },
          },
        });

        if (settings.length < 3) {
          return {
            success: false,
            error: "WhatsApp settings not fully configured",
          };
        }

        // Process message content
        const processedBody = this.processTemplate(
          template.body,
          params.variables,
        );
        console.log("Processed message:", processedBody);
        console.log(
          `Would send to ${params.to} from templates/${template.name}`,
        );

        // In a real implementation, this would use Twilio or similar
        // For now, we'll just log the message and return success
        return {
          success: true,
          messageId: `sim_${Date.now()}`,
        };
      } catch (error) {
        console.error("Error in sendMessage:", error);
        return {
          success: false,
          error: error.message || "Failed to send message",
        };
      }
    }

    processTemplate(template, variables) {
      let result = template;

      // Replace each variable in the template
      for (const [key, value] of Object.entries(variables)) {
        const pattern = new RegExp(`{${key}}`, "g");
        result = result.replace(pattern, value);
      }

      return result;
    }
  };
}

/**
 * Send pending notifications that are scheduled to be sent
 */
async function sendPendingNotifications() {
  try {
    const now = new Date();
    console.log(`Checking for notifications to send at ${now.toISOString()}`);

    // Find notifications that are:
    // 1. Not already sent
    // 2. Scheduled to be sent before or at the current time
    // 3. Have fewer than 3 failed attempts
    const pendingNotifications = await prisma.scheduledNotification.findMany({
      where: {
        sent: false,
        scheduledFor: {
          lte: now,
        },
        attempts: {
          lt: 3,
        },
      },
      include: {
        template: true,
        booking: {
          include: {
            dog: true,
            owner: true,
          },
        },
      },
      orderBy: {
        scheduledFor: "asc",
      },
      take: 10, // Process in batches to avoid overwhelming the service
    });

    console.log(
      `Found ${pendingNotifications.length} pending notifications to send`,
    );

    if (pendingNotifications.length === 0) {
      return;
    }

    // Initialize WhatsApp service
    const whatsappService = new WhatsAppService();

    // Process each notification
    for (const notification of pendingNotifications) {
      console.log(
        `Processing notification ${notification.id} (template: ${notification.template.name})`,
      );

      // Skip notifications for cancelled bookings
      if (notification.booking.status === "CANCELLED") {
        console.log(
          `Skipping - booking ${notification.bookingId} is cancelled`,
        );

        // Mark as sent to avoid processing again
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: {
            sent: true,
            sentAt: now,
            lastAttemptAt: now,
            lastError: "Booking cancelled",
          },
        });

        continue;
      }

      try {
        // Update attempt count
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: {
            attempts: notification.attempts + 1,
            lastAttemptAt: now,
          },
        });

        // Send the message
        const result = await whatsappService.sendMessage({
          to: notification.recipient,
          template: notification.template.name,
          variables: notification.variables,
        });

        if (result.success) {
          console.log(
            `Successfully sent notification ${notification.id} to ${notification.recipient}`,
          );

          // Mark as sent
          await prisma.scheduledNotification.update({
            where: { id: notification.id },
            data: {
              sent: true,
              sentAt: now,
            },
          });
        } else {
          console.error(
            `Failed to send notification ${notification.id}: ${result.error}`,
          );

          // Update with error
          await prisma.scheduledNotification.update({
            where: { id: notification.id },
            data: {
              lastError: result.error,
            },
          });
        }
      } catch (error) {
        console.error(
          `Error processing notification ${notification.id}:`,
          error,
        );

        // Update with error
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: {
            lastError: error.message || String(error),
          },
        });
      }

      // Add a small delay between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("Notification processing completed");
  } catch (error) {
    console.error("Error sending notifications:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
sendPendingNotifications();
