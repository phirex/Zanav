import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createHandler(async ({ client, tenantId }) => {
  console.log("[DEBUG_DASHBOARD] Checking dashboard data for tenant:", tenantId);
  
  const adminClient = supabaseAdmin();
  const today = new Date();
  const currentMonth = today.getMonth();
  const demoYear = 2025;
  const monthStart = new Date(demoYear, currentMonth, 1);
  const monthEnd = new Date(demoYear, currentMonth + 1, 0);
  
  console.log("[DEBUG_DASHBOARD] Looking for bookings in:", {
    month: currentMonth,
    year: demoYear,
    monthStart: monthStart.toISOString(),
    monthEnd: monthEnd.toISOString()
  });
  
  // Get all bookings for the current month in demo year
  const { data: bookings, error: bookingsError } = await adminClient
    .from("Booking")
    .select("*, payments:Payment(*)")
    .gte("startDate", monthStart.toISOString())
    .lte("endDate", monthEnd.toISOString())
    .eq("tenantId", tenantId || "");
    
  if (bookingsError) {
    console.error("[DEBUG_DASHBOARD] Error fetching bookings:", bookingsError);
    return { error: bookingsError.message };
  }
  
  console.log("[DEBUG_DASHBOARD] Found bookings for current month:", bookings?.length || 0);
  
  // Calculate monthly income
  let monthlyTotal = 0;
  const monthlyBookings = bookings?.filter((booking) => {
    if (!booking.startDate || !booking.endDate) return false;
    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);
    
    return (
      (bookingStart.getMonth() === currentMonth && bookingStart.getFullYear() === demoYear) ||
      (bookingEnd.getMonth() === currentMonth && bookingEnd.getFullYear() === demoYear) ||
      (bookingStart <= monthStart && bookingEnd >= monthEnd)
    );
  }) || [];
  
  console.log("[DEBUG_DASHBOARD] Filtered monthly bookings:", monthlyBookings.length);
  
  monthlyTotal = monthlyBookings.reduce((total, booking) => {
    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);
    const overlapStart = new Date(Math.max(bookingStart.getTime(), monthStart.getTime()));
    const overlapEnd = new Date(Math.min(bookingEnd.getTime(), monthEnd.getTime()));
    const daysInMonth = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (booking.totalPrice) {
      const totalDays = Math.ceil((bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return total + (booking.totalPrice / totalDays) * daysInMonth;
    } else if (booking.pricePerDay) {
      return total + (booking.pricePerDay * daysInMonth);
    }
    return total;
  }, 0);
  
  return {
    tenantId,
    currentMonth,
    demoYear,
    monthStart: monthStart.toISOString(),
    monthEnd: monthEnd.toISOString(),
    totalBookings: bookings?.length || 0,
    monthlyBookings: monthlyBookings.length,
    monthlyTotal,
    sampleBookings: monthlyBookings.slice(0, 3).map(b => ({
      id: b.id,
      startDate: b.startDate,
      endDate: b.endDate,
      totalPrice: b.totalPrice,
      pricePerDay: b.pricePerDay
    }))
  };
}); 