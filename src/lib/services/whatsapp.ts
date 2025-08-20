import {
  getSetting,
  getNotificationTemplateByName,
} from "@/lib/supabase/helpers";
import type { Database } from "@/lib/database.types";
import { assertFeatureEnabled } from "@/lib/plan";

type TriggerType = Database["public"]["Enums"]["TriggerType"];

interface SendMessageOptions {
  to: string;
  template: string;
  variables: Record<string, string>;
  tenantId?: string;
}

interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: any;
}

export class WhatsAppService {
  private async loadSettings() {
    try {
      // Get WhatsApp settings from database
      const accountSid = await getSetting("TWILIO_ACCOUNT_SID");
      const authToken = await getSetting("TWILIO_AUTH_TOKEN");
      const phoneNumber = await getSetting("TWILIO_PHONE_NUMBER");

      // Fall back to env variables if database settings are not available
      return {
        accountSid: accountSid || process.env.TWILIO_ACCOUNT_SID,
        authToken: authToken || process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: phoneNumber || process.env.TWILIO_PHONE_NUMBER,
      };
    } catch (error) {
      console.error("Error loading WhatsApp settings:", error);

      // Fall back to env variables
      return {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      };
    }
  }

  async sendMessage(options: SendMessageOptions): Promise<MessageResult> {
    // Enforce plan gate for WhatsApp messages per tenant
    if (options.tenantId) {
      await assertFeatureEnabled(options.tenantId, "whatsapp");
    }
    try {
      const settings = await this.loadSettings();

      // Check if required settings are available
      if (
        !settings.accountSid ||
        !settings.authToken ||
        !settings.phoneNumber
      ) {
        console.error("Missing Twilio credentials");
        return {
          success: false,
          error: "Missing Twilio credentials",
        };
      }

      // Import Twilio
      const twilio = require("twilio");
      const client = twilio(settings.accountSid, settings.authToken);

      // Format the message
      const messageContent = await this.formatMessage(
        options.template,
        options.variables,
      );

      if (!messageContent) {
        return {
          success: false,
          error: "Failed to format message",
        };
      }

      // Send the message
      console.log(
        `Sending WhatsApp message to ${options.to} using template ${options.template}`,
      );
      const message = await client.messages.create({
        body: messageContent,
        from: `whatsapp:${settings.phoneNumber}`,
        to: `whatsapp:${options.to}`,
      });

      console.log(`WhatsApp message sent with ID: ${message.sid}`);

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      return {
        success: false,
        error,
      };
    }
  }

  private async formatMessage(
    templateName: string,
    variables: Record<string, string>,
  ): Promise<string | null> {
    try {
      // Get template from database
      let template = await getNotificationTemplateByName(templateName);

      // If not found, try a default template
      if (!template && templateName !== "default") {
        console.log(
          `Template ${templateName} not found, trying default template`,
        );
        template = await getNotificationTemplateByName("default");
      }

      // If still not found, return null
      if (!template) {
        console.error("No template found");
        return null;
      }

      // Replace variables in the body
      let message = template.body;

      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        message = message.replace(new RegExp(placeholder, "g"), value);
      }

      return message;
    } catch (error) {
      console.error("Error formatting message:", error);
      return null;
    }
  }
}
