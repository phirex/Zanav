import { createAdminHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createAdminHandler(async () => {
  try {
    const adminSupabase = supabaseAdmin();

    // Get recent activities from various sources
    const [
      recentTenants,
      recentBookings,
      recentPayments,
      recentUsers
    ] = await Promise.all([
      // Recent tenant creations
      adminSupabase
        .from("Tenant")
        .select("id, name, createdAt")
        .order("createdAt", { ascending: false })
        .limit(5),
      
      // Recent bookings
      adminSupabase
        .from("Booking")
        .select("id, startDate, endDate, tenantId, createdAt")
        .order("createdAt", { ascending: false })
        .limit(5),
      
      // Recent payments
      adminSupabase
        .from("Payment")
        .select("id, amount, createdAt")
        .order("createdAt", { ascending: false })
        .limit(5),
      
      // Recent user creations
      adminSupabase
        .from("User")
        .select("id, name, email, createdAt")
        .order("createdAt", { ascending: false })
        .limit(5)
    ]);

    const activities: any[] = [];

    // Add tenant activities
    recentTenants.data?.forEach(tenant => {
      activities.push({
        id: `tenant-${tenant.id}`,
        type: 'tenant_created',
        message: `New tenant "${tenant.name}" created`,
        timestamp: tenant.createdAt,
        severity: 'success'
      });
    });

    // Add booking activities
    recentBookings.data?.forEach(booking => {
      activities.push({
        id: `booking-${booking.id}`,
        type: 'system_alert',
        message: `New booking from ${new Date(booking.startDate).toLocaleDateString()} to ${new Date(booking.endDate).toLocaleDateString()}`,
        timestamp: booking.createdAt,
        severity: 'info'
      });
    });

    // Add payment activities
    recentPayments.data?.forEach(payment => {
      if (payment.amount && payment.amount > 1000) {
        activities.push({
          id: `payment-${payment.id}`,
          type: 'revenue_milestone',
          message: `High-value payment: $${payment.amount}`,
          timestamp: payment.createdAt,
          severity: 'success'
        });
      }
    });

    // Add user activities
    recentUsers.data?.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user_promoted',
        message: `New user "${user.name || user.email}" joined`,
        timestamp: user.createdAt,
        severity: 'info'
      });
    });

    // Sort by timestamp and return top 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
}); 