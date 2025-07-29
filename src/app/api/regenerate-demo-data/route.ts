import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const POST = createHandler(async ({ client, tenantId }) => {
  console.log("[REGENERATE_DEMO_DATA] Starting complete demo data regeneration...");
  
  const adminSupabase = supabaseAdmin();
  
  try {
    // Clear all existing data
    console.log("[REGENERATE_DEMO_DATA] Clearing existing data...");
    
    await adminSupabase.from("Payment").delete().eq("tenantId", tenantId || "");
    await adminSupabase.from("Booking").delete().eq("tenantId", tenantId || "");
    await adminSupabase.from("Dog").delete().eq("tenantId", tenantId || "");
    await adminSupabase.from("Owner").delete().eq("tenantId", tenantId || "");
    await adminSupabase.from("Room").delete().eq("tenantId", tenantId || "");
    
    console.log("[REGENERATE_DEMO_DATA] Existing data cleared");

    // Create rooms
    const roomsData = [
      { name: "small", displayName: "Small Suite A", maxCapacity: 2, tenantId },
      { name: "medium", displayName: "Medium Room", maxCapacity: 3, tenantId },
      { name: "large", displayName: "Large Room", maxCapacity: 4, tenantId },
      { name: "vip", displayName: "VIP Suite", maxCapacity: 2, tenantId },
    ];

    const { data: rooms, error: roomsError } = await adminSupabase
      .from("Room")
      .insert(roomsData)
      .select();

    if (roomsError) throw roomsError;
    console.log(`[REGENERATE_DEMO_DATA] Created ${rooms.length} rooms`);

    // Create owners
    const ownersData = [
      { name: "Sarah Johnson", phone: "+1-555-0101", email: "sarah@email.com", tenantId },
      { name: "Michael Chen", phone: "+1-555-0102", email: "michael@email.com", tenantId },
      { name: "Emily Rodriguez", phone: "+1-555-0103", email: "emily@email.com", tenantId },
      { name: "David Thompson", phone: "+1-555-0104", email: "david@email.com", tenantId },
      { name: "Lisa Wang", phone: "+1-555-0105", email: "lisa@email.com", tenantId },
      { name: "James Wilson", phone: "+1-555-0106", email: "james@email.com", tenantId },
    ];

    const { data: owners, error: ownersError } = await adminSupabase
      .from("Owner")
      .insert(ownersData)
      .select();

    if (ownersError) throw ownersError;
    console.log(`[REGENERATE_DEMO_DATA] Created ${owners.length} owners`);

    // Create dogs
    const dogsData = [
      { name: "Max", breed: "Golden Retriever", ownerId: owners[0].id, tenantId },
      { name: "Bella", breed: "Labrador", ownerId: owners[0].id, tenantId },
      { name: "Charlie", breed: "German Shepherd", ownerId: owners[1].id, tenantId },
      { name: "Luna", breed: "Husky", ownerId: owners[1].id, tenantId },
      { name: "Cooper", breed: "Border Collie", ownerId: owners[2].id, tenantId },
      { name: "Daisy", breed: "Beagle", ownerId: owners[2].id, tenantId },
      { name: "Rocky", breed: "Boxer", ownerId: owners[3].id, tenantId },
      { name: "Molly", breed: "Poodle", ownerId: owners[3].id, tenantId },
      { name: "Buddy", breed: "Bulldog", ownerId: owners[4].id, tenantId },
      { name: "Sophie", breed: "Chihuahua", ownerId: owners[4].id, tenantId },
      { name: "Tucker", breed: "Australian Shepherd", ownerId: owners[5].id, tenantId },
      { name: "Zoe", breed: "Siberian Husky", ownerId: owners[5].id, tenantId },
    ];

    const { data: dogs, error: dogsError } = await adminSupabase
      .from("Dog")
      .insert(dogsData)
      .select();

    if (dogsError) throw dogsError;
    console.log(`[REGENERATE_DEMO_DATA] Created ${dogs.length} dogs`);

    // Create bookings - concentrated in July 2025 for calendar visibility
    console.log("[REGENERATE_DEMO_DATA] Creating bookings...");
    const bookingsData = [];
    let totalGeneratedRevenue = 0;
    
    // Create 300 bookings with more concentration in July 2025
    for (let i = 0; i < 300; i++) {
      const dog = dogs[i % dogs.length];
      const room = rooms[i % rooms.length];
      const owner = owners.find((o) => o.id === dog.ownerId);

      // Generate dates with concentration in July 2025
      let startDate;
      if (i < 150) {
        // 50% of bookings in July 2025
        startDate = new Date(2025, 6, Math.floor(Math.random() * 31) + 1);
      } else if (i < 225) {
        // 25% in June 2025
        startDate = new Date(2025, 5, Math.floor(Math.random() * 30) + 1);
      } else if (i < 270) {
        // 15% in August 2025
        startDate = new Date(2025, 7, Math.floor(Math.random() * 31) + 1);
      } else {
        // 10% in other months
        startDate = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      }
      
      const duration = Math.floor(Math.random() * 7) + 1; // 1-7 days
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);

      // Pricing
      let pricePerDay = 120;
      if (room.name === 'vip') pricePerDay = 200;
      else if (room.name === 'large') pricePerDay = 150;
      else if (room.name === 'medium') pricePerDay = 130;

      const totalPrice = pricePerDay * duration;

      // Status - mostly confirmed for calendar visibility
      const statusRoll = Math.random();
      let status: "PENDING" | "CONFIRMED" | "CANCELLED";
      if (statusRoll < 0.85) status = "CONFIRMED";
      else if (statusRoll < 0.95) status = "PENDING";
      else status = "CANCELLED";

      const paymentMethods = ["CASH", "CREDIT_CARD", "BANK_TRANSFER", "BIT"] as const;
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      bookingsData.push({
        dogId: dog.id,
        roomId: room.id,
        ownerId: owner!.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        priceType: "DAILY" as const,
        pricePerDay,
        totalPrice,
        paymentMethod,
        status,
        tenantId: tenantId,
      });

      if (status === "CONFIRMED") {
        totalGeneratedRevenue += totalPrice;
      }
    }

    const { data: bookings, error: bookingsError } = await adminSupabase
      .from("Booking")
      .insert(bookingsData)
      .select();

    if (bookingsError) throw bookingsError;
    console.log(`[REGENERATE_DEMO_DATA] Created ${bookings.length} bookings with revenue: $${totalGeneratedRevenue.toLocaleString()}`);

    // Create payments with proper dates
    console.log("[REGENERATE_DEMO_DATA] Creating payments...");
    const paymentsData = [];
    
    for (const booking of bookings) {
      if (booking.status === "CONFIRMED" && Math.random() < 0.9) {
        const paymentAmount = (booking.totalPrice || 0) * (Math.random() * 0.3 + 0.7); // 70-100%
        
        // Create payment date around the booking start date
        const bookingStartDate = new Date(booking.startDate);
        const daysBeforeBooking = Math.floor(Math.random() * 7) + 1; // 1-7 days before
        const paymentDate = new Date(bookingStartDate);
        paymentDate.setDate(paymentDate.getDate() - daysBeforeBooking);
        
        paymentsData.push({
          bookingId: booking.id,
          amount: paymentAmount,
          method: booking.paymentMethod,
          tenantId: tenantId,
          createdAt: paymentDate.toISOString(),
        });
      }
    }

    const { data: payments, error: paymentsError } = await adminSupabase
      .from("Payment")
      .insert(paymentsData)
      .select();

    if (paymentsError) throw paymentsError;
    console.log(`[REGENERATE_DEMO_DATA] Created ${payments.length} payments`);

    // Create notification templates
    console.log("[REGENERATE_DEMO_DATA] Creating notification templates...");
    const templatesData = [
      {
        name: "Booking Confirmation",
        description: "Sent immediately when booking is confirmed",
        subject: "Booking Confirmed - Welcome to Happy Paws Kennel!",
        body: "Hello {ownerName}, your booking for {dogName} from {startDate} to {endDate} has been confirmed. Room: {roomName}. Total: ${totalPrice}. Thank you for choosing us!",
        tenantId: tenantId,
        trigger: "BOOKING_CONFIRMATION" as const,
        active: true,
      },
      {
        name: "Reminder - Day Before",
        description: "Sent one day before the booking starts",
        subject: "Reminder: Your dog's stay starts tomorrow",
        body: "Hi {ownerName}, just a friendly reminder that {dogName} is scheduled to arrive tomorrow at {startDate}. Please bring any special food or medications. See you soon!",
        tenantId: tenantId,
        trigger: "CUSTOM" as const,
        active: true,
      },
      {
        name: "Check-in Confirmation",
        description: "Sent when dog is checked in",
        subject: "{dogName} has been checked in successfully",
        body: "Hello {ownerName}, {dogName} has been checked in and is settling in nicely. We'll send you updates throughout their stay. Have a great day!",
        tenantId: tenantId,
        trigger: "CUSTOM" as const,
        active: true,
      },
    ];

    const { data: templates, error: templatesError } = await adminSupabase
      .from("NotificationTemplate")
      .insert(templatesData)
      .select();

    if (templatesError) throw templatesError;
    console.log(`[REGENERATE_DEMO_DATA] Created ${templates.length} notification templates`);

    return {
      success: true,
      message: `Demo data regenerated successfully! Created ${owners.length} owners, ${dogs.length} dogs, ${bookings.length} bookings, ${payments.length} payments. Projected annual revenue: $${totalGeneratedRevenue.toLocaleString()}`,
      summary: {
        owners: owners.length,
        dogs: dogs.length,
        bookings: bookings.length,
        payments: payments.length,
        rooms: rooms.length,
        templates: templates.length,
        projectedRevenue: totalGeneratedRevenue
      }
    };

  } catch (error) {
    console.error("[REGENERATE_DEMO_DATA] Error:", error);
    throw error;
  }
}); 