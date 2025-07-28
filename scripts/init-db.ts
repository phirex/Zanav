import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  try {
    // Set tenant context for default tenant
    await supabase.rpc("set_tenant_context", {
      tenant_id: "00000000-0000-0000-0000-000000000000",
    });

    // Check if rooms exist
    const { data: existingRooms } = await supabase
      .from("Room")
      .select("id")
      .in("id", [1, 2, 3]);

    const roomsExist = existingRooms && existingRooms.length === 3;

    // Create rooms
    let room1, room2, room3;

    if (!roomsExist) {
      // Create Room 1
      const { data: room1Data, error: room1Error } = await supabase
        .from("Room")
        .upsert({
          id: 1,
          name: "חדר קטנים",
          displayName: "חדר קטנים",
          capacity: 0,
          maxCapacity: 5,
          tenantId: "00000000-0000-0000-0000-000000000000",
        })
        .select()
        .single();

      if (room1Error) throw room1Error;
      room1 = room1Data;

      // Create Room 2
      const { data: room2Data, error: room2Error } = await supabase
        .from("Room")
        .upsert({
          id: 2,
          name: "חדר גדולים",
          displayName: "חדר גדולים",
          capacity: 0,
          maxCapacity: 3,
          tenantId: "00000000-0000-0000-0000-000000000000",
        })
        .select()
        .single();

      if (room2Error) throw room2Error;
      room2 = room2Data;

      // Create Room 3
      const { data: room3Data, error: room3Error } = await supabase
        .from("Room")
        .upsert({
          id: 3,
          name: "בית",
          displayName: "בית",
          capacity: 0,
          maxCapacity: 2,
          tenantId: "00000000-0000-0000-0000-000000000000",
        })
        .select()
        .single();

      if (room3Error) throw room3Error;
      room3 = room3Data;
    } else {
      console.log("Rooms already exist, skipping creation");
    }

    // Check if owner exists
    const { data: existingOwners } = await supabase
      .from("Owner")
      .select("id")
      .eq("id", 1);

    const ownerExists = existingOwners && existingOwners.length > 0;

    // Create sample owner
    let owner;
    if (!ownerExists) {
      const { data: ownerData, error: ownerError } = await supabase
        .from("Owner")
        .upsert({
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          phone: "1234567890",
          address: "123 Main St",
          tenantId: "00000000-0000-0000-0000-000000000000",
        })
        .select()
        .single();

      if (ownerError) throw ownerError;
      owner = ownerData;
    } else {
      console.log("Owner already exists, skipping creation");
    }

    // Check if dogs exist
    const { data: existingDogs } = await supabase
      .from("Dog")
      .select("id")
      .in("id", [1, 2]);

    const dogsExist = existingDogs && existingDogs.length === 2;

    // Create sample dogs for the owner
    let dog1, dog2;
    if (!dogsExist) {
      const { data: dog1Data, error: dog1Error } = await supabase
        .from("Dog")
        .upsert({
          id: 1,
          name: "Max",
          breed: "Golden Retriever",
          specialNeeds: "None",
          ownerId: 1,
          tenantId: "00000000-0000-0000-0000-000000000000",
        })
        .select()
        .single();

      if (dog1Error) throw dog1Error;
      dog1 = dog1Data;

      const { data: dog2Data, error: dog2Error } = await supabase
        .from("Dog")
        .upsert({
          id: 2,
          name: "Bella",
          breed: "Poodle",
          specialNeeds: "Special diet",
          ownerId: 1,
          tenantId: "00000000-0000-0000-0000-000000000000",
        })
        .select()
        .single();

      if (dog2Error) throw dog2Error;
      dog2 = dog2Data;
    } else {
      console.log("Dogs already exist, skipping creation");
    }

    // Check if booking exists
    const { data: existingBookings } = await supabase
      .from("Booking")
      .select("id")
      .eq("id", 1);

    const bookingExists = existingBookings && existingBookings.length > 0;

    // Create sample booking
    let booking;
    if (!bookingExists) {
      const { data: bookingData, error: bookingError } = await supabase
        .from("Booking")
        .upsert({
          id: 1,
          dogId: 1,
          roomId: 1,
          ownerId: 1,
          startDate: new Date("2024-03-01").toISOString(),
          endDate: new Date("2024-03-05").toISOString(),
          priceType: "DAILY",
          pricePerDay: 150,
          totalPrice: null,
          paymentMethod: "CASH",
          status: "CONFIRMED",
          tenantId: "00000000-0000-0000-0000-000000000000",
        })
        .select()
        .single();

      if (bookingError) throw bookingError;
      booking = bookingData;
    } else {
      console.log("Booking already exists, skipping creation");
    }

    console.log("Database initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
