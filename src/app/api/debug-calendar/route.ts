import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createHandler(async ({ client, tenantId }) => {
  console.log("[DEBUG_CALENDAR] Checking calendar data for tenant:", tenantId);
  
  const adminClient = supabaseAdmin();
  
  // Get all rooms
  const { data: rooms, error: roomsError } = await adminClient
    .from("Room")
    .select("*")
    .eq("tenantId", tenantId || "");
    
  if (roomsError) {
    console.error("[DEBUG_CALENDAR] Error fetching rooms:", roomsError);
    return { error: roomsError.message };
  }
  
  console.log("[DEBUG_CALENDAR] Found rooms:", rooms?.length || 0);
  
  // Get all bookings for July 2025
  const { data: bookings, error: bookingsError } = await adminClient
    .from("Booking")
    .select("*, dog:Dog(*), room:Room(*)")
    .gte("startDate", "2025-07-01")
    .lte("endDate", "2025-07-31")
    .eq("tenantId", tenantId || "");
    
  if (bookingsError) {
    console.error("[DEBUG_CALENDAR] Error fetching bookings:", bookingsError);
    return { error: bookingsError.message };
  }
  
  console.log("[DEBUG_CALENDAR] Found bookings for July 2025:", bookings?.length || 0);
  
  // Check specific dates
  const testDates = ["2025-07-15", "2025-07-20", "2025-07-25"];
  const dateAnalysis = testDates.map(date => {
    const dateBookings = bookings?.filter(booking => {
      const startDate = booking.startDate?.substring(0, 10);
      const endDate = booking.endDate?.substring(0, 10);
      return startDate && endDate && date >= startDate && date < endDate;
    }) || [];
    
    const roomStatus = rooms?.map(room => {
      const roomBookings = dateBookings.filter(booking => booking.roomId === room.id);
      const occupancy = roomBookings.length;
      const percentage = (occupancy / room.maxCapacity) * 100;
      
      let status = "green";
      if (percentage >= 100) status = "red";
      else if (percentage >= 30) status = "yellow";
      
      return {
        roomId: room.id,
        roomName: room.displayName,
        maxCapacity: room.maxCapacity,
        occupancy,
        percentage,
        status,
        bookings: roomBookings.map(b => ({
          id: b.id,
          dogName: b.dog?.name,
          startDate: b.startDate,
          endDate: b.endDate,
          status: b.status
        }))
      };
    }) || [];
    
    return {
      date,
      totalBookings: dateBookings.length,
      roomStatus
    };
  });
  
  // Sample bookings
  const sampleBookings = bookings?.slice(0, 5).map(b => ({
    id: b.id,
    dogName: b.dog?.name,
    roomName: b.room?.displayName,
    startDate: b.startDate,
    endDate: b.endDate,
    status: b.status
  })) || [];
  
  return {
    tenantId,
    roomsCount: rooms?.length || 0,
    bookingsCount: bookings?.length || 0,
    sampleBookings,
    dateAnalysis,
    rooms: rooms?.map(r => ({
      id: r.id,
      name: r.displayName,
      maxCapacity: r.maxCapacity
    })) || []
  };
}); 