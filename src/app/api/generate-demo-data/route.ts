import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const POST = createHandler(async ({ client, tenantId }) => {
  console.log("[GENERATE_DEMO_DATA] Starting simple demo data generation...");

  if (!tenantId) {
    throw new Error("No tenant found. Please complete tenant setup first.");
  }

  console.log(`[GENERATE_DEMO_DATA] Found tenant: ${tenantId}`);

  // Use admin client for full access
  const adminSupabase = supabaseAdmin();

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
  ];

  const { data: owners, error: ownersError } = await adminSupabase
    .from("Owner")
    .insert(ownersData)
    .select();

  if (ownersError) throw ownersError;
  console.log(`[GENERATE_DEMO_DATA] Created ${owners.length} owners`);

  // Create dogs
  console.log("[GENERATE_DEMO_DATA] Creating dogs...");
  const dogsData = [
    {
      name: "Buddy",
      breed: "Golden Retriever",
      specialNeeds: null,
      ownerId: owners[0].id,
      tenantId: tenantId,
    },
    {
      name: "Bella",
      breed: "German Shepherd",
      specialNeeds: null,
      ownerId: owners[1].id,
      tenantId: tenantId,
    },
    {
      name: "Max",
      breed: "Labrador Retriever",
      specialNeeds: null,
      ownerId: owners[2].id,
      tenantId: tenantId,
    },
  ];

  const { data: dogs, error: dogsError } = await adminSupabase
    .from("Dog")
    .insert(dogsData)
    .select();

  if (dogsError) throw dogsError;
  console.log(`[GENERATE_DEMO_DATA] Created ${dogs.length} dogs`);

  // Create simple bookings
  console.log("[GENERATE_DEMO_DATA] Creating bookings...");
  const bookingsData = [];
  
  // Create 20 simple bookings
  for (let i = 0; i < 20; i++) {
    const dog = dogs[i % dogs.length];
    const room = rooms[i % rooms.length];
    const owner = owners.find((o) => o.id === dog.ownerId);

    // Simple date generation - spread across next 3 months
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 90));
    const duration = Math.floor(Math.random() * 7) + 1;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    const pricePerDay = 120 + (i * 10); // Varying prices
    const totalPrice = pricePerDay * duration;

    bookingsData.push({
      dogId: dog.id,
      roomId: room.id,
      ownerId: owner!.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      priceType: "DAILY" as const,
      pricePerDay,
      totalPrice,
      paymentMethod: "CREDIT_CARD" as const,
      status: "CONFIRMED" as const,
      tenantId: tenantId,
    });
  }

  const { data: bookings, error: bookingsError } = await adminSupabase
    .from("Booking")
    .insert(bookingsData)
    .select();

  if (bookingsError) throw bookingsError;
  console.log(`[GENERATE_DEMO_DATA] Created ${bookings.length} bookings`);

  // Create simple payments
  console.log("[GENERATE_DEMO_DATA] Creating payments...");
  const paymentsData = [];
  
  for (const booking of bookings) {
    if (Math.random() < 0.7) { // 70% of bookings have payments
      paymentsData.push({
        bookingId: booking.id,
        amount: booking.totalPrice || 0,
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
      subject: "Booking Confirmed - Welcome to Our Kennel!",
      body: "Hello {ownerName}, your booking for {dogName} from {startDate} to {endDate} has been confirmed. Room: {roomName}. Total: ${totalPrice}. Thank you!",
      trigger: "BOOKING_CONFIRMATION" as const,
      delayHours: 0,
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
    message: `Demo data generated successfully! Created ${owners.length} owners, ${dogs.length} dogs, ${bookings.length} bookings, and ${payments.length} payments.`,
    summary: {
      owners: owners.length,
      dogs: dogs.length,
      bookings: bookings.length,
      payments: payments.length,
      rooms: rooms.length,
      templates: templates.length,
    }
  };
});
