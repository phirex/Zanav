import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const POST = createHandler(async ({ client, tenantId }) => {
  console.log("[GENERATE_DEMO_DATA] Starting robust demo data generation...");

  if (!tenantId) {
    throw new Error("No tenant found. Please complete tenant setup first.");
  }

  console.log(`[GENERATE_DEMO_DATA] Found tenant: ${tenantId}`);

  // Use admin client for full access
  const adminSupabase = supabaseAdmin();

  try {
    // Clear existing demo data for this tenant
    console.log("[GENERATE_DEMO_DATA] Clearing existing demo data...");
    await adminSupabase.from("Payment").delete().eq("tenantId", tenantId);
    await adminSupabase.from("Booking").delete().eq("tenantId", tenantId);
    await adminSupabase.from("Dog").delete().eq("tenantId", tenantId);
    await adminSupabase.from("Owner").delete().eq("tenantId", tenantId);
    await adminSupabase.from("Room").delete().eq("tenantId", tenantId);
    await adminSupabase.from("NotificationTemplate").delete().eq("tenantId", tenantId);
    
    console.log("[GENERATE_DEMO_DATA] Cleared existing data");

    // Create rooms
    console.log("[GENERATE_DEMO_DATA] Creating rooms...");
    const roomsData = [
      {
        name: "small-suite-a",
        displayName: "Small Suite A",
        capacity: 5,
        tenantId: tenantId,
      },
      {
        name: "medium",
        displayName: "Medium Room",
        capacity: 10,
        tenantId: tenantId,
      },
      {
        name: "vip",
        displayName: "VIP Suite",
        capacity: 8,
        tenantId: tenantId,
      },
      {
        name: "large",
        displayName: "Large Room",
        capacity: 15,
        tenantId: tenantId,
      },
    ];

    const { data: rooms, error: roomsError } = await adminSupabase
      .from("Room")
      .insert(roomsData)
      .select();

    if (roomsError) throw roomsError;
    console.log(`[GENERATE_DEMO_DATA] Created ${rooms.length} rooms`);

    // Create owners
    console.log("[GENERATE_DEMO_DATA] Creating owners...");
    const ownersData = [
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@gmail.com",
        phone: "+1-555-0123",
        address: "New York, NY",
        tenantId: tenantId,
      },
      {
        name: "Michael Chen",
        email: "michael.chen@outlook.com",
        phone: "+1-555-0124",
        address: "San Francisco, CA",
        tenantId: tenantId,
      },
      {
        name: "Emma Rodriguez",
        email: "emma.rodriguez@yahoo.com",
        phone: "+1-555-0125",
        address: "Miami, FL",
        tenantId: tenantId,
      },
      {
        name: "David Thompson",
        email: "david.thompson@hotmail.com",
        phone: "+1-555-0126",
        address: "Chicago, IL",
        tenantId: tenantId,
      },
      {
        name: "Lisa Anderson",
        email: "lisa.anderson@gmail.com",
        phone: "+1-555-0127",
        address: "Seattle, WA",
        tenantId: tenantId,
      },
      {
        name: "James Wilson",
        email: "james.wilson@outlook.com",
        phone: "+1-555-0128",
        address: "Austin, TX",
        tenantId: tenantId,
      },
    ];

    const { data: owners, error: ownersError } = await adminSupabase
      .from("Owner")
      .insert(ownersData)
      .select();

    if (ownersError) throw ownersError;
    console.log(`[GENERATE_DEMO_DATA] Created ${owners.length} owners`);

    // Create dogs
    console.log("[GENERATE_DEMO_DATA] Creating dogs...");
    const dogBreeds = [
      "Golden Retriever", "German Shepherd", "Labrador Retriever", "Poodle", "Bulldog",
      "Husky", "Border Collie", "Beagle", "Rottweiler", "Dachshund", "Yorkshire Terrier",
      "Boxer", "Great Dane", "Chihuahua", "Siberian Husky", "Bernese Mountain Dog",
    ];
    
    const dogNames = [
      "Buddy", "Bella", "Max", "Luna", "Charlie", "Lucy", "Cooper", "Daisy",
      "Rocky", "Sadie", "Duke", "Molly", "Bear", "Stella", "Jack", "Sophie",
      "Toby", "Chloe", "Buster", "Lola", "Rex", "Zoe", "Oscar", "Ruby",
    ];

    const dogsData = [];
    for (let i = 0; i < 24; i++) {
      const owner = owners[i % owners.length];
      dogsData.push({
        name: dogNames[i],
        breed: dogBreeds[i % dogBreeds.length],
        specialNeeds: Math.random() < 0.2 ? "Needs medication twice daily" : null,
        ownerId: owner.id,
        tenantId: tenantId,
      });
    }

    const { data: dogs, error: dogsError } = await adminSupabase
      .from("Dog")
      .insert(dogsData)
      .select();

    if (dogsError) throw dogsError;
    console.log(`[GENERATE_DEMO_DATA] Created ${dogs.length} dogs`);

    // Create bookings - simplified approach
    console.log("[GENERATE_DEMO_DATA] Creating bookings...");
    const bookingsData = [];
    let totalGeneratedRevenue = 0;
    
    // Create 200 bookings spread across 2025
    for (let i = 0; i < 200; i++) {
      const dog = dogs[i % dogs.length];
      const room = rooms[i % rooms.length];
      const owner = owners.find((o) => o.id === dog.ownerId);

      // Generate dates across 2025
      const startDate = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const duration = Math.floor(Math.random() * 14) + 1;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);

      // Simple pricing
      let pricePerDay = 120;
      if (room.name === 'vip') pricePerDay = 200;
      else if (room.name === 'large') pricePerDay = 150;
      else if (room.name === 'medium') pricePerDay = 130;

      const totalPrice = pricePerDay * duration;

      // Status distribution
      const statusRoll = Math.random();
      let status: "PENDING" | "CONFIRMED" | "CANCELLED";
      if (statusRoll < 0.7) status = "CONFIRMED";
      else if (statusRoll < 0.9) status = "PENDING";
      else status = "CANCELLED";

      // Payment method
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
    console.log(`[GENERATE_DEMO_DATA] Created ${bookings.length} bookings with revenue: $${totalGeneratedRevenue.toLocaleString()}`);

    // Create payments
    console.log("[GENERATE_DEMO_DATA] Creating payments...");
    const paymentsData = [];
    
    for (const booking of bookings) {
      if (booking.status === "CONFIRMED" && Math.random() < 0.85) {
        const paymentAmount = (booking.totalPrice || 0) * (Math.random() * 0.4 + 0.6);
        
        paymentsData.push({
          bookingId: booking.id,
          amount: paymentAmount,
          method: booking.paymentMethod,
          tenantId: tenantId,
        });
      }
    }

    const { data: payments, error: paymentsError } = await adminSupabase
      .from("Payment")
      .insert(paymentsData)
      .select();

    if (paymentsError) throw paymentsError;
    console.log(`[GENERATE_DEMO_DATA] Created ${payments.length} payments`);

    // Create notification templates
    console.log("[GENERATE_DEMO_DATA] Creating notification templates...");
    const templatesData = [
      {
        name: "Booking Confirmation",
        description: "Sent immediately when booking is confirmed",
        subject: "Booking Confirmed - Welcome to Happy Paws Kennel!",
        body: "Hello {ownerName}, your booking for {dogName} from {startDate} to {endDate} has been confirmed. Room: {roomName}. Total: ${totalPrice}. Thank you for choosing us!",
        trigger: "BOOKING_CONFIRMATION" as const,
        delayHours: 0,
        active: true,
        tenantId: tenantId,
      },
      {
        name: "Check-in Reminder",
        description: "Sent 24 hours before check-in",
        subject: "Check-in Reminder - {dogName} Tomorrow",
        body: "Hi {ownerName}, this is a reminder that {dogName} is scheduled to check in tomorrow at {startDate}. Please bring vaccination records and any special items.",
        trigger: "CHECK_IN_REMINDER" as const,
        delayHours: 24,
        active: true,
        tenantId: tenantId,
      },
    ];

    const { data: templates, error: templatesError } = await adminSupabase
      .from("NotificationTemplate")
      .insert(templatesData)
      .select();

    if (templatesError) throw templatesError;
    console.log(`[GENERATE_DEMO_DATA] Created ${templates.length} notification templates`);

    console.log("[GENERATE_DEMO_DATA] Demo data generation completed successfully!");

    return {
      success: true,
      message: `Demo data generated successfully! Created ${owners.length} owners, ${dogs.length} dogs, ${bookings.length} bookings, ${payments.length} payments. Projected annual revenue: $${totalGeneratedRevenue.toLocaleString()}`,
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
    console.error("[GENERATE_DEMO_DATA] Error:", error);
    throw new Error(`Demo data generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
