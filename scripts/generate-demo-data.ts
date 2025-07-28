// Script to generate demo data for the Demo Pension tenant
import { createClient } from "@supabase/supabase-js";
import { addDays, subDays, format } from "date-fns";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Check for environment files
const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath = path.resolve(process.cwd(), ".env");

// Next.js prioritizes .env.local over .env
if (fs.existsSync(envLocalPath)) {
  console.log("Using .env.local file");
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log("Using .env file");
  dotenv.config({ path: envPath });
} else {
  console.error(`Error: Neither .env.local nor .env file found.`);
  console.error(`
Please run setup with:

npm run demo:setup

This will create the necessary environment file with Supabase credentials.
`);
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables are set
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Required environment variables are missing.");
  console.error(
    "Please make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Ori's Kennel Tenant ID
const DEMO_TENANT_ID = "7699bcba-3837-4fe9-982c-d68a09a5260a"; // Ori Kennel tenant

// Sample data for generating random bookings
const dogNames = [
  "Buddy",
  "Luna",
  "Charlie",
  "Bella",
  "Max",
  "Lucy",
  "Cooper",
  "Daisy",
  "Rocky",
  "Lola",
  "Milo",
  "Sadie",
  "Teddy",
  "Ruby",
  "Duke",
  "Coco",
  "Oliver",
  "Molly",
  "Tucker",
  "Sophie",
  "Bear",
  "Rosie",
  "Winston",
  "Gracie",
];

const dogBreeds = [
  "Labrador Retriever",
  "Golden Retriever",
  "German Shepherd",
  "Poodle",
  "Bulldog",
  "Beagle",
  "Rottweiler",
  "Siberian Husky",
  "Dachshund",
  "Shih Tzu",
  "Chihuahua",
  "Pomeranian",
  "Border Collie",
  "Mixed Breed",
  "Yorkshire Terrier",
  "Boxer",
  "Cocker Spaniel",
  "Australian Shepherd",
];

const ownerNames = [
  "John Smith",
  "Maria Garcia",
  "James Johnson",
  "Sarah Brown",
  "David Lee",
  "Emma Wilson",
  "Michael Davis",
  "Olivia Martinez",
  "Robert Taylor",
  "Sophia Anderson",
  "William Thompson",
  "Ava Jackson",
  "Thomas White",
  "Emily Harris",
  "Daniel Clark",
  "Amelia Lewis",
  "Joseph Walker",
  "Mia Allen",
  "Christopher Young",
  "Abigail Scott",
];

const ownerEmails = [
  "john.smith@example.com",
  "maria.garcia@example.com",
  "james.johnson@example.com",
  "sarah.brown@example.com",
  "david.lee@example.com",
  "emma.wilson@example.com",
  "michael.davis@example.com",
  "olivia.martinez@example.com",
  "robert.taylor@example.com",
  "sophia.anderson@example.com",
  "william.thompson@example.com",
  "ava.jackson@example.com",
  "thomas.white@example.com",
  "emily.harris@example.com",
  "daniel.clark@example.com",
  "amelia.lewis@example.com",
  "joseph.walker@example.com",
  "mia.allen@example.com",
  "christopher.young@example.com",
  "abigail.scott@example.com",
];

const phoneNumbers = [
  "050-1234567",
  "052-2345678",
  "054-3456789",
  "053-4567890",
  "058-5678901",
  "050-6789012",
  "052-7890123",
  "054-8901234",
  "053-9012345",
  "058-0123456",
  "050-1122334",
  "052-2233445",
  "054-3344556",
  "053-4455667",
  "058-5566778",
  "050-6677889",
  "052-7788990",
  "054-8899001",
  "053-9900112",
  "058-0011223",
];

// Helper functions
function getRandomElement(array: any[]) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(start: Date, end: Date) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

// Generate a random booking
async function generateBooking(
  ownerId: number,
  dogId: number,
  roomId: number,
  startOffset: number = 0,
) {
  // Randomly decide if this is a past, current, or future booking
  const bookingType = Math.random();
  let startDate, endDate;

  const today = new Date();

  // 30% past bookings
  if (bookingType < 0.3) {
    // Past booking (between 1-60 days ago)
    const pastDaysStart = getRandomInt(60, 10);
    const pastDaysEnd = getRandomInt(9, 1);
    startDate = subDays(today, pastDaysStart + startOffset);
    endDate = subDays(today, pastDaysEnd + startOffset);
  }
  // 20% current bookings
  else if (bookingType < 0.5) {
    // Current booking (started up to 7 days ago, ends in the next 1-7 days)
    const daysAgo = getRandomInt(7, 1);
    const daysAhead = getRandomInt(7, 1);
    startDate = subDays(today, daysAgo + startOffset);
    endDate = addDays(today, daysAhead + startOffset);
  }
  // 50% future bookings
  else {
    // Future booking (starts in 1-30 days, stays for 1-14 days)
    const futureDaysStart = getRandomInt(30, 1);
    const stayLength = getRandomInt(14, 1);
    startDate = addDays(today, futureDaysStart + startOffset);
    endDate = addDays(startDate, stayLength);
  }

  // 80% daily pricing, 20% fixed pricing
  const isPriceDaily = Math.random() < 0.8;
  const pricePerDay = isPriceDaily ? getRandomInt(120, 80) : null;

  // Calculate days difference
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const totalPrice = isPriceDaily
    ? null // If daily pricing, let the system calculate it
    : getRandomInt(daysDiff * 120, daysDiff * 80);

  // 85% confirmed, 10% pending, 5% cancelled
  const statusRandom = Math.random();
  let status;
  if (statusRandom < 0.85) status = "CONFIRMED";
  else if (statusRandom < 0.95) status = "PENDING";
  else status = "CANCELLED";

  // Payment methods: 40% cash, 30% credit card, 20% bank transfer, 10% BIT
  let paymentMethod;
  const methodRandom = Math.random();
  if (methodRandom < 0.4) paymentMethod = "CASH";
  else if (methodRandom < 0.7) paymentMethod = "CREDIT_CARD";
  else if (methodRandom < 0.9) paymentMethod = "BANK_TRANSFER";
  else paymentMethod = "BIT";

  // Create the booking with all required fields
  const booking = {
    dogId,
    roomId,
    ownerId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    priceType: isPriceDaily ? "DAILY" : "FIXED",
    pricePerDay,
    totalPrice,
    status,
    paymentMethod, // This is required by the database schema
    tenantId: DEMO_TENANT_ID,
    exemptLastDay: Math.random() < 0.2, // 20% chance to exempt last day
  };

  return booking;
}

// Main function to generate all data
async function generateDemoData() {
  console.log("Starting demo data generation...");

  // Double-check environment variables again
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error("Required environment variables are not set.");
    console.error(
      "Please make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file.",
    );
    return;
  }

  console.log(`Using Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`Using tenant ID: ${DEMO_TENANT_ID}`);

  // Verify tenant exists
  try {
    const { data: tenant, error: tenantError } = await supabase
      .from("Tenant")
      .select("id, name")
      .eq("id", DEMO_TENANT_ID)
      .single();

    if (tenantError || !tenant) {
      console.log(
        "Target tenant not found. Checking if it exists with this ID...",
      );

      // Try to find any tenant with this ID first
      const { data: existingTenant, error: existingError } = await supabase
        .from("Tenant")
        .select("id, name, subdomain")
        .eq("id", DEMO_TENANT_ID)
        .maybeSingle();

      if (existingTenant) {
        console.log(
          `Found existing tenant: ${existingTenant.name} (${existingTenant.subdomain}) with ID: ${existingTenant.id}`,
        );
      } else {
        console.log(
          "Tenant not found with this ID. This may be due to RLS policies. Continuing anyway...",
        );
      }
    } else {
      console.log(
        `Found existing tenant: ${tenant.name} with ID: ${tenant.id}`,
      );
    }
  } catch (error: any) {
    console.error("Error verifying tenant:", error);
    return;
  }

  // Set tenant context for RLS
  try {
    await supabase.rpc("set_tenant", { _tenant_id: DEMO_TENANT_ID });
    console.log("Set tenant context for:", DEMO_TENANT_ID);
  } catch (error: any) {
    console.error("Error setting tenant context:", error);
    return;
  }

  // 1. First, get available rooms for the tenant
  let roomsToUse;
  try {
    const { data: rooms, error: roomsError } = await supabase
      .from("Room")
      .select("id, name")
      .eq("tenantId", DEMO_TENANT_ID);

    if (roomsError) {
      console.error("Error fetching rooms:", roomsError);
      return;
    }

    if (!rooms || rooms.length === 0) {
      console.log("No rooms found. Creating default rooms...");

      // Create default rooms
      const defaultRooms = [
        {
          name: "Room 1",
          displayName: "Standard Room",
          capacity: 1,
          tenantId: DEMO_TENANT_ID,
        },
        {
          name: "Room 2",
          displayName: "Deluxe Room",
          capacity: 1,
          tenantId: DEMO_TENANT_ID,
        },
        {
          name: "Room 3",
          displayName: "Premium Suite",
          capacity: 2,
          tenantId: DEMO_TENANT_ID,
        },
        {
          name: "Room 4",
          displayName: "Family Room",
          capacity: 3,
          tenantId: DEMO_TENANT_ID,
        },
        {
          name: "Room 5",
          displayName: "Economy Room",
          capacity: 1,
          tenantId: DEMO_TENANT_ID,
        },
      ];

      const { data: createdRooms, error: createRoomsError } = await supabase
        .from("Room")
        .insert(defaultRooms)
        .select("id, name");

      if (createRoomsError) {
        console.error("Failed to create default rooms:", createRoomsError);
        return;
      }

      if (!createdRooms || createdRooms.length === 0) {
        console.error("Rooms were created but none were returned");
        return;
      }

      console.log(`Created ${createdRooms.length} default rooms`);

      // Use the created rooms
      const { data: refreshedRooms, error: refreshError } = await supabase
        .from("Room")
        .select("id, name")
        .eq("tenantId", DEMO_TENANT_ID);

      if (refreshError) {
        console.error("Error fetching newly created rooms:", refreshError);
        return;
      }

      if (!refreshedRooms || refreshedRooms.length === 0) {
        console.error("No rooms found after creation");
        return;
      }

      console.log(`Found ${refreshedRooms.length} rooms for the tenant`);
      roomsToUse = refreshedRooms;
    } else {
      console.log(`Found ${rooms.length} existing rooms for the tenant`);
      roomsToUse = rooms;
    }

    // 2. Create owners
    const owners = [];
    for (let i = 0; i < 10; i++) {
      const name = ownerNames[i];
      const email = ownerEmails[i];
      const phone = phoneNumbers[i];

      try {
        const { data: owner, error: ownerError } = await supabase
          .from("Owner")
          .insert({
            name,
            email,
            phone,
            tenantId: DEMO_TENANT_ID,
          })
          .select("id")
          .single();

        if (ownerError) {
          console.error(`Error creating owner ${name}:`, ownerError);
          continue;
        }

        if (!owner) {
          console.error(`Owner created but no data returned for ${name}`);
          continue;
        }

        console.log(`Created owner: ${name} with ID: ${owner.id}`);
        owners.push(owner);

        // 3. Create 1-3 dogs for each owner
        const numDogs = getRandomInt(3, 1);
        for (let j = 0; j < numDogs; j++) {
          const dogName = getRandomElement(dogNames);
          const breed = getRandomElement(dogBreeds);

          try {
            const { data: dog, error: dogError } = await supabase
              .from("Dog")
              .insert({
                name: dogName,
                breed,
                ownerId: owner.id,
                tenantId: DEMO_TENANT_ID,
              })
              .select("id")
              .single();

            if (dogError) {
              console.error(`Error creating dog ${dogName}:`, dogError);
              continue;
            }

            if (!dog) {
              console.error(`Dog created but no data returned for ${dogName}`);
              continue;
            }

            console.log(
              `Created dog: ${dogName} (${breed}) for owner ID: ${owner.id}`,
            );

            // 4. Create 1-3 bookings for each dog (some past, some current, some future)
            const numBookings = getRandomInt(3, 1);
            for (let k = 0; k < numBookings; k++) {
              const randomRoom = getRandomElement(roomsToUse);

              try {
                const booking = await generateBooking(
                  owner.id,
                  dog.id,
                  randomRoom.id,
                  k * 3,
                );

                const { data: createdBooking, error: bookingError } =
                  await supabase
                    .from("Booking")
                    .insert(booking)
                    .select("id")
                    .single();

                if (bookingError) {
                  console.error("Error creating booking:", bookingError);
                  continue;
                }

                if (!createdBooking) {
                  console.error("Booking created but no data returned");
                  continue;
                }

                console.log(
                  `Created booking ID: ${createdBooking.id} for dog: ${dogName}, room: ${randomRoom.name}`,
                );

                // 5. Create payment for the booking (80% chance of payment for non-cancelled bookings)
                if (booking.status !== "CANCELLED" && Math.random() < 0.8) {
                  // Calculate the total amount to pay
                  const bookingStart = new Date(booking.startDate);
                  const bookingEnd = new Date(booking.endDate);
                  const daysDiff = Math.ceil(
                    (bookingEnd.getTime() - bookingStart.getTime()) /
                      (1000 * 60 * 60 * 24),
                  );

                  const amount =
                    booking.totalPrice ||
                    (booking.pricePerDay
                      ? booking.pricePerDay * daysDiff
                      : 100);

                  // Payment date is between booking creation and start date
                  const paymentDate =
                    bookingStart < new Date()
                      ? subDays(bookingStart, getRandomInt(7, 1))
                      : new Date();

                  try {
                    const { data: payment, error: paymentError } =
                      await supabase
                        .from("Payment")
                        .insert({
                          bookingId: createdBooking.id,
                          amount,
                          method: booking.paymentMethod,
                          tenantId: DEMO_TENANT_ID,
                          createdAt: paymentDate.toISOString(),
                        })
                        .select("id")
                        .single();

                    if (paymentError) {
                      console.error("Error creating payment:", paymentError);
                      continue;
                    }

                    if (!payment) {
                      console.error("Payment created but no data returned");
                      continue;
                    }

                    console.log(
                      `Created payment ID: ${payment.id} for booking ID: ${createdBooking.id}`,
                    );
                  } catch (error: any) {
                    console.error("Unexpected error creating payment:", error);
                  }
                }
              } catch (error: any) {
                console.error("Error in booking creation:", error);
              }
            }
          } catch (error: any) {
            console.error("Error in dog creation:", error);
          }
        }
      } catch (error: any) {
        console.error("Error in owner creation:", error);
      }
    }

    console.log("Demo data generation completed successfully!");
  } catch (error: any) {
    console.error("Error in demo data generation:", error);
  }
}

// Run the demo data generation
generateDemoData()
  .then(() => {
    console.log("✅ Demo data generation completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Demo data generation failed:", error);
    process.exit(1);
  });

export { generateDemoData };
