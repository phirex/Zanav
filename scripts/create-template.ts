import { supabaseServer } from "../src/lib/supabase";
import type { Database } from "../src/lib/database.types";

type TriggerType = Database["public"]["Enums"]["TriggerType"];

async function main() {
  try {
    const supabase = supabaseServer();

    const { data: template, error } = await supabase
      .from("NotificationTemplate")
      .insert({
        name: "booking_confirmation",
        description: "Sent when a booking is confirmed",
        subject: "Booking Confirmation",
        body: "Hello {firstName}, your booking for {petName} from {checkInDate} to {checkOutDate} has been confirmed. Thank you for choosing our pension!",
        trigger: "BOOKING_CONFIRMATION" as TriggerType,
        delayHours: 0,
        active: true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log("Created template:", template);
  } catch (error) {
    console.error("Error creating template:", error);
  }
}

main();
