import { createAdminHandlerWithAuth } from "@/lib/apiHandler";

export const GET = createAdminHandlerWithAuth(async ({ client }) => {
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

  // Normalize to a single activity list
  const items = [
    ...(recentBookings || []).map((b: any) => ({
      id: String(b.id),
      type: "booking",
      message: `Booking ${b.id} - ${b.status}`,
      timestamp: b.createdAt,
      severity: b.status === "CANCELLED" ? "warning" : "success",
    })),
    ...(recentUsers || []).map((u: any) => ({
      id: String(u.id),
      type: "user",
      message: `User ${u.email || u.name || u.id} created`,
      timestamp: u.createdAt,
      severity: "info",
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

  return items;
}); 