import { createAdminHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createAdminHandler(async () => {
  try {
    const adminSupabase = supabaseAdmin();

    // Get real statistics from the database
    const [
      tenantsResult,
      usersResult,
      bookingsResult,
      notificationsResult,
      revenueResult
    ] = await Promise.all([
      // Total tenants
      adminSupabase
        .from("Tenant")
        .select("id", { count: "exact" }),
      
      // Total users
      adminSupabase
        .from("User")
        .select("id", { count: "exact" }),
      
      // Total bookings
      adminSupabase
        .from("Booking")
        .select("id", { count: "exact" }),
      
      // Active notifications
      adminSupabase
        .from("ScheduledNotification")
        .select("id", { count: "exact" })
        .eq("sent", false),
      
      // Monthly revenue (sum of all payments this month)
      adminSupabase
        .from("Payment")
        .select("amount")
        .gte("createdAt", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ]);

    // Calculate monthly revenue
    const monthlyRevenue = revenueResult.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

    // Get active tenants (tenants with recent activity)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeTenantsResult = await adminSupabase
      .from("Booking")
      .select("tenantId")
      .gte("createdAt", thirtyDaysAgo.toISOString())
      .limit(1000);

    const activeTenants = new Set(activeTenantsResult.data?.map(b => b.tenantId) || []).size;

    // Check for pending approvals (bookings with PENDING status)
    const pendingApprovalsResult = await adminSupabase
      .from("Booking")
      .select("id", { count: "exact" })
      .eq("status", "PENDING");

    // Determine system health based on various factors
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (pendingApprovalsResult.data && pendingApprovalsResult.data.length > 10) {
      systemHealth = 'warning';
    }
    
    if (pendingApprovalsResult.data && pendingApprovalsResult.data.length > 50) {
      systemHealth = 'critical';
    }

    return {
      totalTenants: tenantsResult.count || 0,
      totalUsers: usersResult.count || 0,
      totalBookings: bookingsResult.count || 0,
      activeNotifications: notificationsResult.count || 0,
      monthlyRevenue: monthlyRevenue,
      systemHealth: systemHealth,
      activeTenants: activeTenants,
      pendingApprovals: pendingApprovalsResult.count || 0
    };

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalTenants: 0,
      totalUsers: 0,
      totalBookings: 0,
      activeNotifications: 0,
      monthlyRevenue: 0,
      systemHealth: 'healthy',
      activeTenants: 0,
      pendingApprovals: 0
    };
  }
}); 