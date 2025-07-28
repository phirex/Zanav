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

  // Create kennel website data
  console.log("[GENERATE_DEMO_DATA] Creating kennel website data...");
  
  // Get tenant subdomain
  const { data: tenantData, error: tenantError } = await adminSupabase
    .from("Tenant")
    .select("subdomain")
    .eq("id", tenantId)
    .single();

  if (tenantError || !tenantData.subdomain) {
    console.error("[GENERATE_DEMO_DATA] Error fetching tenant subdomain:", tenantError);
  } else {
    // Create main website data
    const websiteData = {
      subdomain: tenantData.subdomain,
      hero_title: "Welcome to Happy Paws Kennel",
      hero_tagline: "Where every dog feels like family",
      allow_direct_booking: true,
      theme_color: "#3B82F6",
      seo_title: "Happy Paws Kennel - Premium Dog Boarding & Care",
      seo_description: "Professional dog boarding services with 24/7 care, spacious rooms, and loving attention. Book your dog's stay today!",
      address: "123 Dog Street, Tel Aviv, Israel",
      contact_phone: "+972-52-123-4567",
      contact_email: "info@happypaws.co.il",
      contact_whatsapp: "+972-52-123-4567",
      special_restrictions: "All dogs must be up to date on vaccinations. Aggressive dogs may require special arrangements.",
      tenant_id: tenantId,
    };

    // Check if website already exists
    const { data: existingWebsite } = await adminSupabase
      .from("kennel_websites")
      .select("id")
      .eq("tenant_id", tenantId)
      .single();

    let websiteId: string | undefined;

    if (existingWebsite) {
      // Update existing website
      const { data: updatedWebsite, error: updateError } = await adminSupabase
        .from("kennel_websites")
        .update(websiteData)
        .eq("tenant_id", tenantId)
        .select("id")
        .single();

      if (updateError) {
        console.error("[GENERATE_DEMO_DATA] Error updating website:", updateError);
      } else {
        websiteId = updatedWebsite.id;
        console.log("[GENERATE_DEMO_DATA] Updated existing website");
      }
    } else {
      // Create new website
      const { data: newWebsite, error: createError } = await adminSupabase
        .from("kennel_websites")
        .insert(websiteData)
        .select("id")
        .single();

      if (createError) {
        console.error("[GENERATE_DEMO_DATA] Error creating website:", createError);
      } else {
        websiteId = newWebsite.id;
        console.log("[GENERATE_DEMO_DATA] Created new website");
      }
    }

    if (websiteId) {
      // Create gallery images
      const galleryImages = [
        {
          website_id: websiteId,
          image_url: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=600&fit=crop",
          caption: "Spacious indoor play area",
          sort_order: 1,
        },
        {
          website_id: websiteId,
          image_url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop",
          caption: "Comfortable sleeping quarters",
          sort_order: 2,
        },
        {
          website_id: websiteId,
          image_url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop",
          caption: "Outdoor exercise yard",
          sort_order: 3,
        },
      ];

      await adminSupabase.from("kennel_website_images").delete().eq("website_id", websiteId);
      const { data: images, error: imagesError } = await adminSupabase
        .from("kennel_website_images")
        .insert(galleryImages as any)
        .select();

      if (imagesError) {
        console.error("[GENERATE_DEMO_DATA] Error creating gallery images:", imagesError);
      } else {
        console.log(`[GENERATE_DEMO_DATA] Created ${images.length} gallery images`);
      }

      // Create testimonials
      const testimonials = [
        {
          website_id: websiteId,
          customer_name: "Sarah Cohen",
          customer_photo_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
          rating: 5,
          testimonial_text: "Amazing care for my Golden Retriever! The staff is so loving and professional. I can relax knowing my dog is in good hands.",
          sort_order: 1,
        },
        {
          website_id: websiteId,
          customer_name: "David Levi",
          customer_photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
          rating: 5,
          testimonial_text: "Best kennel in Tel Aviv! My dog comes back happy and tired from all the playtime. Highly recommended!",
          sort_order: 2,
        },
        {
          website_id: websiteId,
          customer_name: "Rachel Goldberg",
          customer_photo_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
          rating: 5,
          testimonial_text: "The facilities are clean, the staff is caring, and my dog loves it here. Perfect for our family vacations.",
          sort_order: 3,
        },
      ];

      await adminSupabase.from("kennel_website_testimonials").delete().eq("website_id", websiteId);
      const { data: testimonialData, error: testimonialsError } = await adminSupabase
        .from("kennel_website_testimonials")
        .insert(testimonials as any)
        .select();

      if (testimonialsError) {
        console.error("[GENERATE_DEMO_DATA] Error creating testimonials:", testimonialsError);
      } else {
        console.log(`[GENERATE_DEMO_DATA] Created ${testimonialData.length} testimonials`);
      }

      // Create FAQs
      const faqs = [
        {
          website_id: websiteId,
          question: "What vaccinations does my dog need?",
          answer: "All dogs must be up to date on rabies, DHPP, and bordetella vaccinations. Please bring vaccination records.",
          sort_order: 1,
        },
        {
          website_id: websiteId,
          question: "Can I bring my dog's own food?",
          answer: "Yes! We encourage you to bring your dog's regular food to maintain their diet and avoid stomach upset.",
          sort_order: 2,
        },
        {
          website_id: websiteId,
          question: "Do you offer pick-up and drop-off services?",
          answer: "Yes, we offer convenient pick-up and drop-off services within Tel Aviv for an additional fee.",
          sort_order: 3,
        },
        {
          website_id: websiteId,
          question: "What if my dog has special needs?",
          answer: "We accommodate dogs with special needs, medications, and dietary requirements. Please discuss with us in advance.",
          sort_order: 4,
        },
      ];

      await adminSupabase.from("kennel_website_faqs").delete().eq("website_id", websiteId);
      const { data: faqData, error: faqsError } = await adminSupabase
        .from("kennel_website_faqs")
        .insert(faqs as any)
        .select();

      if (faqsError) {
        console.error("[GENERATE_DEMO_DATA] Error creating FAQs:", faqsError);
      } else {
        console.log(`[GENERATE_DEMO_DATA] Created ${faqData.length} FAQs`);
      }
    }
  }

  const summary = {
    tenant: tenantId,
    rooms: rooms.length,
    owners: owners.length,
    dogs: dogs.length,
    bookings: bookings.length,
    payments: payments.length,
    templates: templates ? templates.length : 0,
    website: "created",
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
