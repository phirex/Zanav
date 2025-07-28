import { NextRequest, NextResponse } from "next/server";
import { WhatsAppService } from "@/lib/services/whatsapp";
import { getNotificationTemplates } from "@/lib/supabase/helpers";

export { dynamic } from "@/lib/forceDynamic";

// GET /api/test-whatsapp
export async function GET(request: NextRequest) {
  try {
    // Get phone number from query parameter
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required as a query parameter" },
        { status: 400 },
      );
    }

    // Check if any BOOKING_CONFIRMATION templates exist
    const templates = await getNotificationTemplates({
      trigger: "BOOKING_CONFIRMATION",
      active: true,
    });

    // Log template status
    if (templates.length === 0) {
      console.error(
        "No active BOOKING_CONFIRMATION templates found in database",
      );

      // List all templates
      const allTemplates = await getNotificationTemplates();
      console.log(
        "Available templates:",
        allTemplates.map(
          (t) => `${t.name} (${t.trigger}, active: ${t.active})`,
        ),
      );

      return NextResponse.json(
        { error: "No active BOOKING_CONFIRMATION templates found" },
        { status: 404 },
      );
    }

    console.log(
      `Found ${templates.length} active BOOKING_CONFIRMATION templates:`,
      templates.map((t) => t.name),
    );

    // Format phone number
    function formatPhoneNumber(input: string): string {
      // Remove all non-digit characters
      const digitsOnly = input.replace(/\D/g, "");

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

    const formattedPhone = formatPhoneNumber(phone);
    console.log(`Formatted phone number: ${phone} -> ${formattedPhone}`);

    // Initialize WhatsApp service
    const whatsappService = new WhatsAppService();

    // Prepare variables for template
    const variables = {
      firstName: "Test",
      petName: "Test Dog",
      checkInDate: "01/01/2023",
      checkOutDate: "05/01/2023",
      bookingId: "12345",
    };

    console.log("Attempting to send test WhatsApp message");
    console.log("Template variables:", variables);

    // Send the message using trigger type
    const result = await whatsappService.sendMessage({
      to: formattedPhone,
      template: "BOOKING_CONFIRMATION", // Use trigger type instead of template name
      variables,
    });

    if (result.success) {
      console.log(
        `Test WhatsApp message sent successfully. Message ID: ${result.messageId}`,
      );
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      console.error(`Failed to send test WhatsApp message:`, result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in test WhatsApp endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 },
    );
  }
}
