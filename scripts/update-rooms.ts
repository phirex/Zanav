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
  // Set tenant context (default tenant)
  await supabase.rpc("set_tenant_context", {
    tenant_id: "00000000-0000-0000-0000-000000000000",
  });

  // Update Room 1
  const { error: error1 } = await supabase
    .from("Room")
    .update({
      displayName: "מתחם קטנים",
      capacity: 5,
    })
    .eq("id", 1);

  if (error1) console.error("Error updating room 1:", error1);

  // Update Room 2
  const { error: error2 } = await supabase
    .from("Room")
    .update({
      displayName: "מתחם גדולים",
      capacity: 3,
    })
    .eq("id", 2);

  if (error2) console.error("Error updating room 2:", error2);

  // Update Room 3
  const { error: error3 } = await supabase
    .from("Room")
    .update({
      displayName: "בית",
      capacity: 2,
    })
    .eq("id", 3);

  if (error3) console.error("Error updating room 3:", error3);

  console.log("Rooms updated successfully!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
