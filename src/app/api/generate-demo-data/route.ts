import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const POST = createHandler(async ({ client, tenantId }) => {
  console.log("[GENERATE_DEMO_DATA] Starting demo data generation...");

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
  await adminSupabase
    .from("NotificationTemplate")
    .delete()
    .eq("tenantId", tenantId);
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
      name: "small-suite-b",
      displayName: "Small Suite B",
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
      name: "large",
      displayName: "Large Room",
      capacity: 15,
      tenantId: tenantId,
    },
    { name: "vip", displayName: "VIP Suite", capacity: 8, tenantId: tenantId },
    {
      name: "outdoor",
      displayName: "Outdoor Play Area",
      capacity: 25,
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
      name: "Sarah Cohen",
      email: "sarah.cohen@gmail.com",
      phone: "052-123-4567",
      address: "Tel Aviv",
      tenantId: tenantId,
    },
    {
      name: "David Levi",
      email: "david.levi@walla.co.il",
      phone: "054-234-5678",
      address: "Jerusalem",
      tenantId: tenantId,
    },
    {
      name: "Rachel Goldberg",
      email: "rachel.g@hotmail.com",
      phone: "050-345-6789",
      address: "Haifa",
      tenantId: tenantId,
    },
    {
      name: "Michael Brown",
      email: "mike.brown@yahoo.com",
      phone: "053-456-7890",
      address: "Herzliya",
      tenantId: tenantId,
    },
    {
      name: "Emma Wilson",
      email: "emma.wilson@gmail.com",
      phone: "052-567-8901",
      address: "Netanya",
      tenantId: tenantId,
    },
    {
      name: "Yoni Dahan",
      email: "yoni.dahan@gmail.com",
      phone: "054-678-9012",
      address: "Beer Sheva",
      tenantId: tenantId,
    },
    {
      name: "Lisa Martinez",
      email: "lisa.martinez@outlook.com",
      phone: "050-789-0123",
      address: "Eilat",
      tenantId: tenantId,
    },
    {
      name: "Amit Rosenberg",
      email: "amit.r@walla.co.il",
      phone: "053-890-1234",
      address: "Ramat Gan",
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
    "Golden Retriever",
    "German Shepherd",
    "Labrador",
    "Poodle",
    "Bulldog",
    "Husky",
    "Border Collie",
    "Beagle",
  ];
  const dogNames = [
    "Buddy",
    "Bella",
    "Max",
    "Luna",
    "Charlie",
    "Lucy",
    "Cooper",
    "Daisy",
    "Rocky",
    "Sadie",
    "Duke",
    "Molly",
    "Bear",
    "Stella",
  ];

  const dogsData = [];
  for (let i = 0; i < 14; i++) {
    const owner = owners[i % owners.length];
    dogsData.push({
      name: dogNames[i],
      breed: dogBreeds[i % dogBreeds.length],
      specialNeeds: Math.random() < 0.3 ? "Needs medication twice daily" : null,
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

  // Create bookings (spanning 3 months past to 3 months future)
  console.log("[GENERATE_DEMO_DATA] Creating bookings...");
  const bookingsData = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);

  for (let i = 0; i < 50; i++) {
    const dog = dogs[Math.floor(Math.random() * dogs.length)];
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    const owner = owners.find((o) => o.id === dog.ownerId);

    const bookingStart = new Date(
      startDate.getTime() + Math.random() * (6 * 30 * 24 * 60 * 60 * 1000),
    );
    const duration = Math.floor(Math.random() * 14) + 1;
    const bookingEnd = new Date(
      bookingStart.getTime() + duration * 24 * 60 * 60 * 1000,
    );

    const pricePerDay = Math.floor(Math.random() * 100) + 80; // 80-180 ILS
    const statuses = ["PENDING", "CONFIRMED", "CANCELLED"];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    bookingsData.push({
      dogId: dog.id,
      roomId: room.id,
      ownerId: owner!.id,
      startDate: bookingStart.toISOString(),
      endDate: bookingEnd.toISOString(),
      priceType: "DAILY" as const,
      pricePerDay,
      totalPrice: pricePerDay * duration,
      paymentMethod: (["CASH", "CREDIT_CARD", "BANK_TRANSFER", "BIT"] as const)[
        Math.floor(Math.random() * 4)
      ],
      status: status as "PENDING" | "CONFIRMED" | "CANCELLED",
      tenantId: tenantId,
    });
  }

  const { data: bookings, error: bookingsError } = await adminSupabase
    .from("Booking")
    .insert(bookingsData)
    .select();

  if (bookingsError) throw bookingsError;
  console.log(`[GENERATE_DEMO_DATA] Created ${bookings.length} bookings`);

  // Create payments (about 74% of bookings should have payments)
  console.log("[GENERATE_DEMO_DATA] Creating payments...");
  const paymentsData = [];
  const bookingsWithPayments = bookings.filter(() => Math.random() < 0.74);

  for (const booking of bookingsWithPayments) {
    if (booking.status !== "CANCELLED") {
      paymentsData.push({
        bookingId: booking.id,
        amount: (booking.totalPrice || 0) * (Math.random() * 0.5 + 0.5), // 50-100% of total
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

  // First, try to delete any existing templates for this tenant to avoid conflicts
  await adminSupabase
    .from("NotificationTemplate")
    .delete()
    .eq("tenantId", tenantId);

  const templatesData = [
    {
      name: `Booking Confirmation - ${tenantId.slice(0, 8)}`,
      description: "Sent immediately when booking is confirmed",
      subject: "Booking Confirmed - Welcome to Our Kennel!",
      body: "Hello {ownerName}, your booking for {dogName} from {startDate} to {endDate} has been confirmed. Room: {roomName}. Total: {totalPrice} ILS. Thank you!",
      trigger: "BOOKING_CONFIRMATION" as const,
      delayHours: 0,
      active: true,
      tenantId: tenantId,
    },
    {
      name: `Check-in Reminder - ${tenantId.slice(0, 8)}`,
      description: "Sent 24 hours before check-in",
      subject: "Check-in Reminder - {dogName} Tomorrow",
      body: "Hi {ownerName}, this is a reminder that {dogName} is scheduled to check in tomorrow at {startDate}. Please bring vaccination records and any special items.",
      trigger: "CHECK_IN_REMINDER" as const,
      delayHours: 24,
      active: true,
      tenantId: tenantId,
    },
    {
      name: `Payment Reminder - ${tenantId.slice(0, 8)}`,
      description: "Sent for unpaid bookings",
      subject: "Payment Reminder - {dogName} Booking",
      body: "Hello {ownerName}, this is a friendly reminder about the outstanding payment for {dogName}'s stay. Amount due: {remainingAmount} ILS.",
      trigger: "PAYMENT_REMINDER" as const,
      delayHours: 0,
      active: true,
      tenantId: tenantId,
    },
  ];

  const { data: templates, error: templatesError } = await adminSupabase
    .from("NotificationTemplate")
    .insert(templatesData)
    .select();

  if (templatesError) {
    console.error("[GENERATE_DEMO_DATA] Templates error:", templatesError);
    // Don't throw, just log and continue
    console.log(
      "[GENERATE_DEMO_DATA] Skipping notification templates due to error",
    );
  } else {
    console.log(
      `[GENERATE_DEMO_DATA] Created ${templates.length} notification templates`,
    );
  }

  const summary = {
    tenant: tenantId,
    rooms: rooms.length,
    owners: owners.length,
    dogs: dogs.length,
    bookings: bookings.length,
    payments: payments.length,
    templates: templates ? templates.length : 0,
  };

  console.log(
    "[GENERATE_DEMO_DATA] Demo data generation completed successfully!",
    summary,
  );

  return {
    success: true,
    message: "Demo data generated successfully!",
    summary,
  };
});
