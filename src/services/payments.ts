import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { WhatsAppService } from "@/lib/services/whatsapp";
import { format } from "date-fns";

function formatPhoneNumber(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.startsWith("0")) return "+972" + digitsOnly.substring(1);
  if (digitsOnly.startsWith("972")) return "+" + digitsOnly;
  return "+972" + digitsOnly;
}

async function sendBookingConfirmation(
  client: SupabaseClient<Database>,
  bookingId: number,
) {
  const { data: booking } = await client
    .from("Booking")
    .select("*, dog:Dog(*), owner:Owner(*)")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return;

  const startDate = format(new Date(booking.startDate), "dd/MM/yyyy");
  const endDate = format(new Date(booking.endDate), "dd/MM/yyyy");
  const phoneNumber = formatPhoneNumber(booking.owner.phone);

  const whatsappService = new WhatsAppService();
  const variables = {
    firstName: booking.owner.name.split(" ")[0],
    petName: booking.dog.name,
    checkInDate: startDate,
    checkOutDate: endDate,
    bookingId: bookingId.toString(),
  } as Record<string, string>;
  await whatsappService.sendMessage({
    to: phoneNumber,
    template: "BOOKING_CONFIRMATION",
    variables,
  });
}

export const PAYMENT_METHODS = [
  "CASH",
  "CREDIT_CARD",
  "BANK_TRANSFER",
  "BIT",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

interface CreatePaymentInput {
  bookingId: number;
  amount: number;
  method: string; // Changed from PaymentMethod to string
}

export async function createPayment(
  client: SupabaseClient<Database>,
  { bookingId, amount, method }: CreatePaymentInput,
) {
  if (!bookingId || !amount || !method) throw new Error("Missing fields");
  if (!PAYMENT_METHODS.includes(method as PaymentMethod))
    throw new Error("Invalid payment method");
  const paymentMethod = method as PaymentMethod;
  if (amount <= 0) throw new Error("Amount must be positive");

  // fetch booking
  const { data: existingBooking, error: bookingErr } = await client
    .from("Booking")
    .select("*, dog:Dog(*, owner:Owner(*)), payments:Payment(*)")
    .eq("id", bookingId)
    .single();
  if (bookingErr || !existingBooking) throw new Error("Booking not found");

  // insert payment
  const { data: paymentRow, error: payErr } = await client
    .from("Payment")
    .insert({
      bookingId,
      amount: parseFloat(amount.toString()),
      method: paymentMethod,
      tenantId: existingBooking.tenantId,
    })
    .select("*")
    .single();
  if (payErr) throw new Error(payErr.message);

  // recalc totals
  const { data: sums } = await client
    .from("Payment")
    .select("amount")
    .eq("bookingId", bookingId);
  const totalPaid = sums?.reduce((sum, p: any) => sum + p.amount, 0) || 0;

  const totalAmount =
    existingBooking.totalPrice ||
    (existingBooking.pricePerDay
      ? existingBooking.pricePerDay *
        Math.ceil(
          (new Date(existingBooking.endDate).getTime() -
            new Date(existingBooking.startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0);

  if (totalPaid >= totalAmount) {
    await client
      .from("Booking")
      .update({ status: "CONFIRMED" })
      .eq("id", bookingId);
    setTimeout(() => {
      // fire and forget
      sendBookingConfirmation(client, bookingId);
    }, 100);
  }

  // return enriched payment
  const { data: completed } = await client
    .from("Payment")
    .select("*, booking:Booking(*, dog:Dog(*, owner:Owner(*)))")
    .eq("id", paymentRow.id)
    .single();

  // Send receipt email if owner has an email
  try {
    const { sendEmail } = await import("@/lib/email/resend");
    const { paymentReceiptCustomerEmail } = await import(
      "@/lib/email/templates"
    );
    // Get kennel name and currency
    const { data: settingsRows } = await client
      .from("Setting")
      .select("key,value")
      .eq("tenantId", existingBooking.tenantId);
    const settings = new Map(
      (settingsRows || []).map((r: any) => [r.key, r.value]),
    );
    const kennelName =
      settings.get("kennelName") ||
      settings.get("businessName") ||
      "Your Kennel";
    const currency = (settings.get("default_currency") || "usd").toUpperCase();

    const ownerEmail = completed?.booking?.dog?.owner?.email as
      | string
      | undefined;
    const ownerName = completed?.booking?.dog?.owner?.name as
      | string
      | undefined;
    const dogName = completed?.booking?.dog?.name as string | undefined;

    if (ownerEmail && ownerName) {
      const amountFormatted = `${Number(amount).toFixed(2)} ${currency}`;
      const startStr = new Date(existingBooking.startDate).toLocaleDateString(
        "en-US",
        { year: "numeric", month: "short", day: "numeric" },
      );
      const endStr = new Date(existingBooking.endDate).toLocaleDateString(
        "en-US",
        { year: "numeric", month: "short", day: "numeric" },
      );
      const balance = Math.max(0, totalAmount - totalPaid);
      const balanceFormatted = `${balance.toFixed(2)} ${currency}`;
      const html = paymentReceiptCustomerEmail({
        kennelName,
        customerName: ownerName,
        amountFormatted,
        dogs: [dogName].filter(Boolean) as string[],
        startDate: startStr,
        endDate: endStr,
        balanceFormatted,
      });
      await sendEmail({ to: ownerEmail, subject: "Payment receipt", html });
    }
  } catch (e) {
    console.warn("Payment receipt email failed", e);
  }

  return completed;
}
