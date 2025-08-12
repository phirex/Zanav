import { createAdminHandlerWithAuth } from "@/lib/apiHandler";

export const GET = createAdminHandlerWithAuth(async ({ client }) => {
  // Tenants and Users
  const { count: totalTenants } = await client
    .from("Tenant")
    .select("*", { count: "exact", head: true });

  const { count: totalUsers } = await client
    .from("User")
    .select("*", { count: "exact", head: true });

  // Bookings (all time)
  const { count: totalBookings } = await client
    .from("Booking")
    .select("*", { count: "exact", head: true });

  // Active scheduled notifications
  const { count: activeNotifications } = await client
    .from("ScheduledNotification")
    .select("*", { count: "exact", head: true })
    .eq("status", "PENDING");

  return {
    totalTenants: totalTenants || 0,
    totalUsers: totalUsers || 0,
    totalBookings: totalBookings || 0,
    activeNotifications: activeNotifications || 0,
  };
}); 