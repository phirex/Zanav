import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const POST = createHandler(async ({ client, tenantId }) => {
  console.log("[GENERATE_DEMO_DATA] Starting comprehensive demo data generation...");

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
  
  // Clear website data
  try {
    const { data: websiteData, error: websiteError } = await adminSupabase
      .from("kennel_websites")
      .select("id")
      .eq("tenant_id", tenantId)
      .single();
    
    if (websiteData?.id) {
      await adminSupabase.from("kennel_website_faqs").delete().eq("website_id", websiteData.id);
      await adminSupabase.from("kennel_website_testimonials").delete().eq("website_id", websiteData.id);
      await adminSupabase.from("kennel_website_videos").delete().eq("website_id", websiteData.id);
      await adminSupabase.from("kennel_website_images").delete().eq("website_id", websiteData.id);
    }
  } catch (error) {
    console.log("[GENERATE_DEMO_DATA] No existing website data to clear, continuing...");
  }
  
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

  // Create owners with international names
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
    {
      name: "Maria Garcia",
      email: "maria.garcia@yahoo.com",
      phone: "+1-555-0129",
      address: "Los Angeles, CA",
      tenantId: tenantId,
    },
    {
      name: "Robert Brown",
      email: "robert.brown@gmail.com",
      phone: "+1-555-0130",
      address: "Denver, CO",
      tenantId: tenantId,
    },
    {
      name: "Jennifer Davis",
      email: "jennifer.davis@hotmail.com",
      phone: "+1-555-0131",
      address: "Boston, MA",
      tenantId: tenantId,
    },
    {
      name: "Christopher Lee",
      email: "christopher.lee@outlook.com",
      phone: "+1-555-0132",
      address: "Portland, OR",
      tenantId: tenantId,
    },
    {
      name: "Amanda Taylor",
      email: "amanda.taylor@gmail.com",
      phone: "+1-555-0133",
      address: "Nashville, TN",
      tenantId: tenantId,
    },
    {
      name: "Daniel Martinez",
      email: "daniel.martinez@yahoo.com",
      phone: "+1-555-0134",
      address: "Phoenix, AZ",
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
    "Labrador Retriever",
    "Poodle",
    "Bulldog",
    "Husky",
    "Border Collie",
    "Beagle",
    "Rottweiler",
    "Dachshund",
    "Yorkshire Terrier",
    "Boxer",
    "Great Dane",
    "Chihuahua",
    "Siberian Husky",
    "Bernese Mountain Dog",
  ];
  
  const dogNames = [
    "Buddy", "Bella", "Max", "Luna", "Charlie", "Lucy", "Cooper", "Daisy",
    "Rocky", "Sadie", "Duke", "Molly", "Bear", "Stella", "Jack", "Sophie",
    "Toby", "Chloe", "Buster", "Lola", "Rex", "Zoe", "Oscar", "Ruby",
    "Bailey", "Penny", "Finn", "Gracie", "Murphy", "Rosie", "Jake", "Maggie",
  ];

  const dogsData = [];
  for (let i = 0; i < 32; i++) {
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

  // Create comprehensive bookings for full year 2025
  console.log("[GENERATE_DEMO_DATA] Creating comprehensive bookings for 2025...");
  const bookingsData = [];
  
  // Generate bookings for the entire year 2025
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-12-31');
  
  // Revenue target: $230,000 for the year
  const targetRevenue = 230000;
  let totalGeneratedRevenue = 0;
  
  // Seasonal multipliers (summer and holidays are busier)
  const seasonalMultipliers = {
    1: 0.7,   // January - slower
    2: 0.8,   // February - slow
    3: 0.9,   // March - picking up
    4: 1.0,   // April - normal
    5: 1.1,   // May - busy
    6: 1.3,   // June - summer starts
    7: 1.5,   // July - peak summer
    8: 1.4,   // August - summer
    9: 1.0,   // September - back to normal
    10: 1.2,  // October - fall busy
    11: 1.1,  // November - normal
    12: 1.3,  // December - holidays
  };

  // Generate bookings with realistic patterns
  for (let month = 1; month <= 12; month++) {
    const monthMultiplier = seasonalMultipliers[month as keyof typeof seasonalMultipliers];
    const bookingsThisMonth = Math.floor(80 * monthMultiplier); // Base 80 bookings per month
    
    for (let i = 0; i < bookingsThisMonth; i++) {
      const dog = dogs[Math.floor(Math.random() * dogs.length)];
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const owner = owners.find((o) => o.id === dog.ownerId);

      // Generate date within the month
      const monthStart = new Date(2025, month - 1, 1);
      const monthEnd = new Date(2025, month, 0);
      const bookingStart = new Date(
        monthStart.getTime() + Math.random() * (monthEnd.getTime() - monthStart.getTime())
      );
      
      // Duration: 1-21 days, with weekends being more popular
      const duration = Math.floor(Math.random() * 21) + 1;
      const bookingEnd = new Date(
        bookingStart.getTime() + duration * 24 * 60 * 60 * 1000
      );

      // Price varies by room type and season
      let basePrice = 120; // Base price per day
      if (room.name === 'vip') basePrice = 200;
      else if (room.name === 'large') basePrice = 150;
      else if (room.name === 'medium') basePrice = 130;
      else if (room.name === 'small-suite-a' || room.name === 'small-suite-b') basePrice = 140;
      else if (room.name === 'outdoor') basePrice = 100;

      // Apply seasonal pricing
      const pricePerDay = Math.floor(basePrice * monthMultiplier);
      const totalPrice = pricePerDay * duration;

      // Status distribution: 70% confirmed, 20% pending, 10% cancelled
      const statusRoll = Math.random();
      let status: "PENDING" | "CONFIRMED" | "CANCELLED";
      if (statusRoll < 0.7) status = "CONFIRMED";
      else if (statusRoll < 0.9) status = "PENDING";
      else status = "CANCELLED";

      // Payment method distribution
      const paymentMethods = ["CASH", "CREDIT_CARD", "BANK_TRANSFER", "BIT"] as const;
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      bookingsData.push({
        dogId: dog.id,
        roomId: room.id,
        ownerId: owner!.id,
        startDate: bookingStart.toISOString(),
        endDate: bookingEnd.toISOString(),
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
  }

  const { data: bookings, error: bookingsError } = await adminSupabase
    .from("Booking")
    .insert(bookingsData)
    .select();

  if (bookingsError) throw bookingsError;
  console.log(`[GENERATE_DEMO_DATA] Created ${bookings.length} bookings with projected revenue: $${totalGeneratedRevenue.toLocaleString()}`);

  // Create payments with realistic patterns
  console.log("[GENERATE_DEMO_DATA] Creating payments...");
  const paymentsData = [];
  
  for (const booking of bookings) {
    if (booking.status === "CONFIRMED") {
      // 85% of confirmed bookings have payments
      if (Math.random() < 0.85) {
        // Payment amount: 60-100% of total (some partial payments)
        const paymentAmount = (booking.totalPrice || 0) * (Math.random() * 0.4 + 0.6);
        
        // Payment date: usually within 30 days of booking start
        const paymentDate = new Date(booking.startDate);
        paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 30));
        
        paymentsData.push({
          bookingId: booking.id,
          amount: paymentAmount,
          method: booking.paymentMethod,
          paymentDate: paymentDate.toISOString(),
          tenantId: tenantId,
        });
      }
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
    {
      name: "Payment Reminder",
      description: "Sent for unpaid bookings",
      subject: "Payment Reminder - {dogName} Booking",
      body: "Hello {ownerName}, this is a friendly reminder about the outstanding payment for {dogName}'s stay. Amount due: ${remainingAmount}.",
      trigger: "PAYMENT_REMINDER" as const,
      delayHours: 0,
      active: true,
      tenantId: tenantId,
    },
    {
      name: "Check-out Reminder",
      description: "Sent 2 hours before check-out",
      subject: "Check-out Reminder - {dogName} Today",
      body: "Hi {ownerName}, {dogName} is scheduled to check out today at {endDate}. Please pick up your furry friend!",
      trigger: "CHECK_OUT_REMINDER" as const,
      delayHours: 2,
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
    message: `Demo data generated successfully! Created ${owners.length} owners, ${dogs.length} dogs, ${bookings.length} bookings, ${payments.length} payments, and comprehensive website content. Projected annual revenue: $${totalGeneratedRevenue.toLocaleString()}`,
    stats: {
      owners: owners.length,
      dogs: dogs.length,
      bookings: bookings.length,
      payments: payments.length,
      projectedRevenue: totalGeneratedRevenue
    }
  };
});
