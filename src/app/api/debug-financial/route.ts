import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createHandler(async ({ client, tenantId }) => {
  console.log("[DEBUG_FINANCIAL] Checking data for tenant:", tenantId);
  
  const adminClient = supabaseAdmin();
  
  // Get all bookings for 2025
  const { data: bookings, error: bookingsError } = await adminClient
    .from("Booking")
    .select("*, payments:Payment(*)")
    .gte("startDate", "2025-01-01")
    .lte("startDate", "2025-12-31")
    .eq("tenantId", tenantId || "");
    
  if (bookingsError) {
    console.error("[DEBUG_FINANCIAL] Error fetching bookings:", bookingsError);
    return { error: bookingsError.message };
  }
  
  console.log("[DEBUG_FINANCIAL] Found bookings:", bookings?.length || 0);
  
  // Get all payments
  const { data: payments, error: paymentsError } = await adminClient
    .from("Payment")
    .select("*")
    .eq("tenantId", tenantId || "");
    
  if (paymentsError) {
    console.error("[DEBUG_FINANCIAL] Error fetching payments:", paymentsError);
    return { error: paymentsError.message };
  }
  
  console.log("[DEBUG_FINANCIAL] Found payments:", payments?.length || 0);
  
  // Calculate totals
  const totalBookings = bookings?.length || 0;
  const totalPayments = payments?.length || 0;
  const totalBookingValue = bookings?.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0) || 0;
  const totalPaymentValue = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
  
  // Sample data
  const sampleBookings = bookings?.slice(0, 3).map(b => ({
    id: b.id,
    startDate: b.startDate,
    endDate: b.endDate,
    totalPrice: b.totalPrice,
    pricePerDay: b.pricePerDay,
    payments: b.payments?.length || 0
  })) || [];
  
  const samplePayments = payments?.slice(0, 3).map(p => ({
    id: p.id,
    amount: p.amount,
    createdAt: p.createdAt,
    bookingId: p.bookingId
  })) || [];
  
  return {
    tenantId,
    totalBookings,
    totalPayments,
    totalBookingValue,
    totalPaymentValue,
    sampleBookings,
    samplePayments
  };
}); 