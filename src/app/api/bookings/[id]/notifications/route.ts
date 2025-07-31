import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { NotificationScheduler } from "@/lib/services/notification-scheduler";

// Define interfaces for the notification data structure
interface Template {
  id: string;
  name: string;
  trigger: string;
  body: string;
}

interface Notification {
  id: string;
  template: Template;
  recipient: string;
  scheduledFor: Date;
  sent: boolean;
  sentAt: Date | null;
  attempts: number;
  lastError: string | null;
  variables: any;
}

// GET /api/bookings/[id]/notifications - Get all notifications for a booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const bookingId = parseInt(id);

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 },
      );
    }

    console.log(`Fetching notifications for booking ${bookingId}`);

    const supabase = supabaseServer();

    // Get tenant ID from request headers
    const tenantId = request.headers.get("x-tenant-id");

    // Remove set_tenant RPC call; rely on explicit tenantId filtering
    // if (tenantId) {
    //   await supabase.rpc("set_tenant", { _tenant_id: tenantId });
    // }

    // Get notifications for this booking
    let query = supabase
      .from("ScheduledNotification")
      .select(
        `
        *,
        template:NotificationTemplate(*)
      `,
      )
      .eq("bookingId", bookingId)
      .order("scheduledFor", { ascending: false });
    if (tenantId) {
      query = query.eq("tenantId", tenantId);
    }
    const { data: notifications, error } = await query;

    if (error) {
      console.error(
        `Error fetching notifications for booking ${bookingId}:`,
        error,
      );
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 },
      );
    }

    return NextResponse.json(notifications || []);
  } catch (error) {
    console.error("Error in GET /api/bookings/[id]/notifications:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

// POST /api/bookings/[id]/notifications - Schedule new notifications for a booking
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const bookingId = parseInt(id);

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 },
      );
    }

    // Check if booking exists
    const supabase = supabaseServer();

    // Get tenant ID from request headers
    const tenantId = request.headers.get("x-tenant-id");

    // Get booking with tenant filtering
    let query = supabase
      .from("Booking")
      .select("*")
      .eq("id", bookingId);
    
    if (tenantId) {
      query = query.eq("tenantId", tenantId);
    }
    
    const { data: booking, error: fetchError } = await query.single();

    if (fetchError || !booking) {
      console.error(`Booking ${bookingId} not found:`, fetchError);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Create notification scheduler with tenant context
    const scheduler = new NotificationScheduler(tenantId || null);

    // Schedule all notification types
    await scheduler.scheduleBookingNotifications(bookingId);

    // Get the newly created notifications
    const { data: notifications, error } = await supabase
      .from("ScheduledNotification")
      .select(
        `
        *,
        template:NotificationTemplate(*)
      `,
      )
      .eq("bookingId", bookingId)
      .order("scheduledFor", { ascending: false });

    return NextResponse.json({
      success: true,
      message: "Notifications scheduled successfully",
      notifications: notifications || [],
    });
  } catch (error) {
    console.error("Error in POST /api/bookings/[id]/notifications:", error);
    return NextResponse.json(
      { error: "Failed to schedule notifications" },
      { status: 500 },
    );
  }
}
