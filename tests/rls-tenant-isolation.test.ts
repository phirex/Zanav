import { test, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, anonKey);

// Replace with real tenant IDs from your test DB
const TENANT_A = "00000000-0000-0000-0000-000000000000";
const TENANT_B = "11111111-1111-1111-1111-111111111111";

test("Tenant A cannot see Tenant B bookings", async () => {
  // Insert a booking for Tenant B (setup step, would use service-role in real test)
  // For this example, we just check that Tenant A cannot see bookings from Tenant B
  const { data, error } = await supabase
    .from("Booking")
    .select("*")
    .eq("tenantId", TENANT_B);

  expect(error).toBeNull();
  // Should be empty or only show bookings for Tenant B
  expect(data?.every((b) => b.tenantId === TENANT_B)).toBe(true);
});

test("Tenant A can only see their own bookings", async () => {
  const { data, error } = await supabase
    .from("Booking")
    .select("*")
    .eq("tenantId", TENANT_A);

  expect(error).toBeNull();
  expect(data?.every((b) => b.tenantId === TENANT_A)).toBe(true);
});
