import { NextResponse } from "next/server";
import { format } from "date-fns";
import { WhatsAppService } from "@/lib/services/whatsapp";
import { supabaseServer } from "@/lib/supabase";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  listBookings,
  createBooking,
  deleteBooking,
} from "@/services/bookings";
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

  // Default to adding +972 prefix
  return "+972" + digitsOnly;
}

// Send WhatsApp booking confirmation
async function sendBookingConfirmation(bookingId: number): Promise<void> {
  try {
    console.log(
      `Attempting to send WhatsApp confirmation for booking ${bookingId}`,
    );

    const supabase = supabaseServer();

    // Get booking details with owner and dog information
    const { data: booking, error } = await supabase
      .from("Booking")
      .select("*, dog:Dog(*), owner:Owner(*)")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      console.error(`Booking ${bookingId} not found:`, error);
      return;
    }

    // Format dates
    const startDate = format(new Date(booking.startDate), "dd/MM/yyyy");
    const endDate = format(new Date(booking.endDate), "dd/MM/yyyy");

    // Format phone number
    const phoneNumber = formatPhoneNumber(booking.owner.phone);
    console.log(
      `Formatted phone number: ${booking.owner.phone} -> ${phoneNumber}`,
    );

    // Initialize WhatsApp service
    const whatsappService = new WhatsAppService();

    // Prepare variables for template
    const variables = {
      firstName: booking.owner.name.split(" ")[0],
      petName: booking.dog.name,
      checkInDate: startDate,
      checkOutDate: endDate,
      bookingId: bookingId.toString(),
    };

    console.log("Template variables:", variables);

    // Send the message using the trigger type instead of template name
    const result = await whatsappService.sendMessage({
      to: phoneNumber,
      template: "BOOKING_CONFIRMATION", // Use trigger type instead of template name
      variables,
    });

    if (result.success) {
      console.log(
        `WhatsApp confirmation sent successfully for booking ${bookingId}. Message ID: ${result.messageId}`,
      );
    } else {
      console.error(
        `Failed to send WhatsApp confirmation for booking ${bookingId}:`,
        result.error,
      );

      // Check if error is related to template not found
      if (
        result.error?.includes("Template") &&
        result.error?.includes("not found")
      ) {
        console.error(
          "Make sure a template with trigger BOOKING_CONFIRMATION exists and is active.",
        );
      }
    }
  } catch (error) {
    console.error("Error sending WhatsApp confirmation:", error);
  }
}

export const GET = createHandler(async ({ req, client, tenantId }) => {
  const { searchParams } = new URL(req.url);

  console.log("[BOOKINGS API] GET request received");
  console.log("[BOOKINGS API] tenantId:", tenantId);
  console.log(
    "[BOOKINGS API] searchParams:",
    Object.fromEntries(searchParams.entries()),
  );
  console.log(
    "[BOOKINGS API] headers x-tenant-id:",
    req.headers.get("x-tenant-id"),
  );

  // Use service-role client to bypass RLS – we still enforce tenant filter
  const adminClient = supabaseAdmin();

  try {
    if (!tenantId) {
      throw new ApiError("missing_tenant", "No tenant found");
    }

    // -----------------------------------------------------------------
    // 1. Verify the authenticated user belongs to this tenant
    // -----------------------------------------------------------------
    const {
      data: { user: authUser },
    } = await client.auth.getUser();

    if (!authUser) {
      throw new ApiError("not_authenticated", "Not authenticated");
    }

    // First, get the User record ID using the supabaseUserId
    const { data: userRecord, error: userError } = await client
      .from("User")
      .select("id")
      .eq("supabaseUserId", authUser.id)
      .single();

    if (userError || !userRecord) {
      console.error("[BOOKINGS API] Failed to find user record:", userError);
      throw new ApiError("user_not_found", "User record not found");
    }

    // Now check if the User.id is linked to this tenant
    const { data: memberRow } = await client
      .from("UserTenant")
      .select("user_id")
      .eq("user_id", userRecord.id)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!memberRow) {
      throw new ApiError(
        "forbidden",
        `User ${userRecord.id} is not a member of tenant ${tenantId}`,
      );
    }

    const bookings = await listBookings(adminClient, tenantId, {
      month: searchParams.get("month"),
      year: searchParams.get("year"),
    });

    console.log("[BOOKINGS API] listBookings result:", {
      all: bookings.all?.length || 0,
      upcoming: bookings.upcoming?.length || 0,
      past: bookings.past?.length || 0,
    });

    return bookings;
  } catch (error) {
    console.error("[API][GET /api/bookings] Error in listBookings", error);
    throw error;
  }
});

export const POST = createHandler(async ({ client, tenantId, body }) => {
  const created = await createBooking(client, tenantId, body);
  return { success: true, bookings: created };
});

export const DELETE = createHandler(async ({ req, client }) => {
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("id");
  if (!idParam) throw new Error("Booking ID is required");
  const bookingId = Number(idParam);
  if (Number.isNaN(bookingId)) throw new Error("Invalid booking ID");
  const deleted = await deleteBooking(client, bookingId);
  return deleted;
});
