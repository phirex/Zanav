import { createAdminHandlerWithAuth } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const POST = createAdminHandlerWithAuth(async ({ body }) => {
  const { userId, supabaseUserId, email, force = false } = body || {};
  const admin = supabaseAdmin();

  // 1) Resolve target user record
  let target: { id: string; tenantId: string | null; supabaseUserId: string } | null = null;

  if (supabaseUserId) {
    const { data } = await admin
      .from("User")
      .select("id, tenantId, supabaseUserId")
      .eq("supabaseUserId", supabaseUserId)
      .maybeSingle();
    target = (data as any) || null;
  } else if (userId) {
    const { data } = await admin
      .from("User")
      .select("id, tenantId, supabaseUserId")
      .eq("id", userId)
      .maybeSingle();
    target = (data as any) || null;
  } else if (email) {
    const { data } = await admin
      .from("User")
      .select("id, tenantId, supabaseUserId")
      .eq("email", email)
      .maybeSingle();
    target = (data as any) || null;
  }

  if (!target) {
    return { error: "User not found" };
  }

  // 2) Do not allow deleting global admins unless force
  const { data: ga } = await admin
    .from("GlobalAdmin")
    .select("id")
    .eq("supabaseUserId", target.supabaseUserId)
    .maybeSingle();
  if (ga && !force) {
    return { error: "Cannot delete a global admin without force=true" };
  }

  // 3) Cascade delete tenant data if present
  if (target.tenantId) {
    const tenantId = target.tenantId;

    // Find kennel website ids for tenant
    const { data: websites } = await admin
      .from("kennel_websites")
      .select("id")
      .eq("tenant_id", tenantId);
    const websiteIds = (websites || []).map((w: any) => w.id);

    if (websiteIds.length > 0) {
      await admin.from("kennel_website_faqs").delete().in("website_id", websiteIds);
      await admin.from("kennel_website_images").delete().in("website_id", websiteIds);
      await admin.from("kennel_website_videos").delete().in("website_id", websiteIds);
      await admin.from("kennel_website_testimonials").delete().in("website_id", websiteIds);
      await admin.from("kennel_websites").delete().eq("tenant_id", tenantId);
    }

    await admin.from("ScheduledNotification").delete().eq("tenantId", tenantId);
    await admin.from("Payment").delete().eq("tenantId", tenantId);
    await admin.from("Booking").delete().eq("tenantId", tenantId);
    await admin.from("Dog").delete().eq("tenantId", tenantId);
    await admin.from("Owner").delete().eq("tenantId", tenantId);
    await admin.from("Room").delete().eq("tenantId", tenantId);
    await admin.from("NotificationTemplate").delete().eq("tenantId", tenantId);
    await admin.from("Setting").delete().eq("tenantId", tenantId);
    await admin.from("ClientSource").delete().eq("tenantId", tenantId);
    await admin.from("UserTenant").delete().eq("tenant_id", tenantId);
    await admin.from("Tenant").delete().eq("id", tenantId);
  }

  // 4) Delete app user row
  await admin.from("User").delete().eq("id", target.id);

  // 5) Delete Supabase Auth user
  if (target.supabaseUserId) {
    await admin.auth.admin.deleteUser(target.supabaseUserId);
  }

  return { success: true };
});
