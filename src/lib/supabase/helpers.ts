import { supabaseServer } from "./server";
import type { Database } from "@/lib/database.types";

type Booking = Database["public"]["Tables"]["Booking"]["Row"];
type Dog = Database["public"]["Tables"]["Dog"]["Row"];
type NotificationTemplate = Database["public"]["Tables"]["NotificationTemplate"]["Row"];
type Owner = Database["public"]["Tables"]["Owner"]["Row"];
type Payment = Database["public"]["Tables"]["Payment"]["Row"];
type Room = Database["public"]["Tables"]["Room"]["Row"];
type ScheduledNotification = Database["public"]["Tables"]["ScheduledNotification"]["Row"];
type Setting = Database["public"]["Tables"]["Setting"]["Row"];
import { getTenantId } from "../tenant";

/**
 * Helper functions for common database operations
 * These functions abstract away the details of Supabase queries
 * and make it easier to transition from Prisma
 */

// Room helpers
export async function getRooms(tenantId?: string) {
  const supabase = supabaseServer();
  const query: any = supabase.from("Room").select("*");

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getRoomById(id: number, tenantId?: string) {
  const supabase = supabaseServer();
  const query: any = supabase.from("Room").select("*").eq("id", id).single();

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error && error.code !== "PGRST116") throw error; // PGRST116 is "no rows returned"
  return data;
}

// Dog helpers
export async function getDogs(tenantId?: string) {
  const supabase = supabaseServer();
  const query: any = supabase.from("Dog").select("*, owner:Owner(*)");

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getDogById(id: number, tenantId?: string) {
  const supabase = supabaseServer();
  const query: any = supabase
    .from("Dog")
    .select("*, owner:Owner(*), currentRoom:Room(*)")
    .eq("id", id)
    .single();

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// Owner helpers
export async function getOwners(tenantId?: string) {
  const supabase = supabaseServer();
  const query: any = supabase.from("Owner").select("*");

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getOwnerById(id: number, tenantId?: string) {
  const supabase = supabaseServer();
  const query: any = supabase
    .from("Owner")
    .select("*, dogs:Dog(*)")
    .eq("id", id)
    .single();

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// Booking helpers
export async function getBookings(tenantId?: string) {
  const supabase = supabaseServer();
  const query = supabase
    .from("Booking")
    .select("*, dog:Dog(*), owner:Owner(*), room:Room(*)");

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getBookingById(id: number, tenantId?: string) {
  const supabase = supabaseServer();
  const query: any = supabase
    .from("Booking")
    .select("*, dog:Dog(*), owner:Owner(*), room:Room(*), payments:Payment(*)")
    .eq("id", id)
    .single();

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createBooking(
  booking: Omit<Booking, "id" | "createdAt" | "updatedAt">,
) {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("Booking")
    .insert([booking])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBooking(
  id: number,
  booking: Partial<Omit<Booking, "id" | "createdAt" | "updatedAt">>,
  tenantId?: string,
) {
  const supabase = supabaseServer();
  const query: any = supabase
    .from("Booking")
    .update(booking)
    .eq("id", id)
    .select()
    .single();

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// Payment helpers
export async function createPayment(
  payment: Omit<Payment, "id" | "createdAt" | "updatedAt">,
) {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("Payment")
    .insert([payment])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPaymentsByBookingId(
  bookingId: number,
  tenantId?: string,
) {
  const supabase = supabaseServer();
  const query: any = supabase
    .from("Payment")
    .select("*")
    .eq("bookingId", bookingId);

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// Settings helpers
export async function getSetting(key: string, tenantId?: string) {
  const supabase = supabaseServer();
  const query: any = supabase
    .from("Setting")
    .select("*")
    .eq("key", key)
    .single();

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error && error.code !== "PGRST116") throw error;
  return data?.value;
}

export async function getSettings(tenantId?: string) {
  const supabase = supabaseServer();
  const query: any = supabase.from("Setting").select("*");

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Convert to key-value object
  const settings: Record<string, string> = {};
  (data || []).forEach((setting: any) => {
    settings[setting.key] = setting.value;
  });

  return settings;
}

// Notification template helpers
export async function getNotificationTemplates(
  params?: { tenantId?: string; trigger?: string; active?: boolean } | string,
) {
  const supabase = supabaseServer();
  let query = supabase.from("NotificationTemplate").select("*");

  // Handle string parameter for backward compatibility
  const tenantId = typeof params === "string" ? params : params?.tenantId;

  if (tenantId) {
    query = query.eq("tenantId", tenantId);
  }

  // Handle new filter parameters
  if (typeof params === "object" && params !== null) {
    if (params.trigger) {
      query = query.eq("trigger", params.trigger as any);
    }

    if (params.active !== undefined) {
      query = query.eq("active", params.active);
    }
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getNotificationTemplateById(
  id: string,
  tenantId?: string,
) {
  const supabase = supabaseServer();
  const query: any = supabase
    .from("NotificationTemplate")
    .select("*")
    .eq("id", id)
    .single();

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getNotificationTemplateByName(
  name: string,
  tenantId?: string,
) {
  const supabase = supabaseServer();
  const query: any = supabase
    .from("NotificationTemplate")
    .select("*")
    .eq("name", name)
    .single();

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// Scheduled notification helpers
export async function getScheduledNotifications(tenantId?: string) {
  const supabase = supabaseServer();
  const query: any = supabase
    .from("ScheduledNotification")
    .select("*, template:NotificationTemplate(*), booking:Booking(*)");

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getScheduledNotificationById(
  id: string,
  tenantId?: string,
) {
  const supabase = supabaseServer();
  const query: any = supabase
    .from("ScheduledNotification")
    .select("*, template:NotificationTemplate(*), booking:Booking(*)")
    .eq("id", id)
    .single();

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function updateScheduledNotification(
  id: string,
  notification: Partial<
    Omit<ScheduledNotification, "id" | "createdAt" | "updatedAt">
  >,
  tenantId?: string,
) {
  const supabase = supabaseServer();
  const query: any = supabase
    .from("ScheduledNotification")
    .update(notification)
    .eq("id", id)
    .select()
    .single();

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// Helper to get pending notifications
export async function getPendingNotifications(tenantId?: string) {
  const supabase = supabaseServer();
  const query: any = supabase
    .from("ScheduledNotification")
    .select("*, template:NotificationTemplate(*), booking:Booking(*)")
    .eq("sent", false)
    .lte("scheduledFor", new Date().toISOString())
    .order("scheduledFor", { ascending: true });

  if (tenantId) {
    query.eq("tenantId", tenantId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// Utility function to run a transaction-like operation
// Note: Supabase doesn't support true transactions from the client
// This is a best-effort approach
export async function runTransaction<T>(
  callback: (supabase: ReturnType<typeof supabaseServer>) => Promise<T>,
): Promise<T> {
  const supabase = supabaseServer();
  try {
    return await callback(supabase);
  } catch (error) {
    console.error("Transaction error:", error);
    throw error;
  }
}
