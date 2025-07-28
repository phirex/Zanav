import { NextRequest, NextResponse } from "next/server";
import { WhatsAppService } from "@/lib/services/whatsapp";
import { ApiError } from "@/lib/apiHandler";

// Format phone number to international format
function formatPhoneNumber(phone: string): string {
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

  // If already has + prefix
  if (digitsOnly.startsWith("+")) {
    return digitsOnly;
  }

  // Default to adding +972 prefix
  return "+972" + digitsOnly;
}

// POST /api/whatsapp/send - Send a WhatsApp message
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    const requiredFields = ["to", "template", "variables"];
    for (const field of requiredFields) {
      if (!data[field]) {
        console.error(`Missing required field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    // Format the phone number if needed
    const rawPhoneNumber = data.to.trim();
    const phoneNumber = formatPhoneNumber(rawPhoneNumber);
    console.log(`Formatting phone number: ${rawPhoneNumber} -> ${phoneNumber}`);

    // Initialize WhatsApp service
    const whatsappService = new WhatsAppService();
    console.log(
      `Attempting to send WhatsApp message to ${phoneNumber} using template: ${data.template}`,
    );
    console.log("Template variables:", data.variables);

    // Send the message
    const result = await whatsappService.sendMessage({
      to: phoneNumber,
      template: data.template,
      variables: data.variables,
    });

    if (result.error) throw new ApiError("whatsapp_send_failed", result.error);

    console.log(
      `WhatsApp message sent successfully. Message ID: ${result.messageId}`,
    );
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error("Error sending WhatsApp message:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send WhatsApp message" },
      { status: 500 },
    );
  }
}
