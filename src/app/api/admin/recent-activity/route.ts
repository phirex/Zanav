import { createAdminHandlerWithAuth } from "@/lib/apiHandler";

export const GET = createAdminHandlerWithAuth(async ({ client }) => {
  // Get recent activity from various tables
  const { data: recentBookings } = await client
    .from("Booking")
    .select("id, createdAt, status, tenantId")
    .order("createdAt", { ascending: false })
    .limit(10);

  const { data: recentUsers } = await client
    .from("User")
    .select("id, createdAt, email, name")
    .order("createdAt", { ascending: false })
    .limit(10);

  return {
    recentBookings: recentBookings || [],
    recentUsers: recentUsers || [],
  };
}); 