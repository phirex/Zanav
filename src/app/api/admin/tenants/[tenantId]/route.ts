import { createAdminHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const DELETE = createAdminHandler(async (ctx) => {
  try {
    const tenantId = Array.isArray(ctx.params?.tenantId) 
      ? ctx.params.tenantId[0] 
      : ctx.params?.tenantId;
    
    if (!tenantId) {
      return { error: "Tenant ID is required" };
    }

    const adminSupabase = supabaseAdmin();

    // First, verify the tenant exists and has no owner
    const { data: tenant, error: tenantError } = await adminSupabase
      .from("Tenant")
      .select("id, name, subdomain")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      return { error: "Tenant not found" };
    }

    // Check if tenant has any owners (should not have any for deletion)
    const { data: owners, error: ownersError } = await adminSupabase
      .from("UserTenant")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .eq("role", "OWNER");

    if (ownersError) {
      console.error("Error checking tenant owners:", ownersError);
      return { error: "Failed to verify tenant ownership" };
    }

    // Allow deletion even with owners - the cascade deletion will handle cleanup
    if (owners && owners.length > 0) {
      console.log(`⚠️ Tenant has ${owners.length} owners, proceeding with deletion anyway`);
    }

    console.log(`Starting deletion of tenant: ${tenant.name} (${tenant.subdomain})`);

    // Begin transaction-like deletion in the correct order
    try {
      // 1. Delete all UserTenant relationships for this tenant
      const { error: userTenantError } = await adminSupabase
        .from("UserTenant")
        .delete()
        .eq("tenant_id", tenantId);

      if (userTenantError) {
        console.error("Error deleting UserTenant relationships:", userTenantError);
        throw new Error("Failed to delete user-tenant relationships");
      }

      // 2. Delete all bookings for this tenant
      const { error: bookingsError } = await adminSupabase
        .from("Booking")
        .delete()
        .eq("tenantId", tenantId);

      if (bookingsError) {
        console.error("Error deleting bookings:", bookingsError);
        throw new Error("Failed to delete bookings");
      }

      // 3. Delete all dogs for this tenant
      const { error: dogsError } = await adminSupabase
        .from("Dog")
        .delete()
        .eq("tenantId", tenantId);

      if (dogsError) {
        console.error("Error deleting dogs:", dogsError);
        throw new Error("Failed to delete dogs");
      }

      // 4. Delete all owners for this tenant
      const { error: ownersError2 } = await adminSupabase
        .from("Owner")
        .delete()
        .eq("tenantId", tenantId);

      if (ownersError2) {
        console.error("Error deleting owners:", ownersError2);
        throw new Error("Failed to delete owners");
      }

      // 5. Delete all rooms for this tenant
      const { error: roomsError } = await adminSupabase
        .from("Room")
        .delete()
        .eq("tenantId", tenantId);

      if (roomsError) {
        console.error("Error deleting rooms:", roomsError);
        throw new Error("Failed to delete rooms");
      }

      // 6. Delete all payments for this tenant
      const { error: paymentsError } = await adminSupabase
        .from("Payment")
        .delete()
        .eq("tenantId", tenantId);

      if (paymentsError) {
        console.error("Error deleting payments:", paymentsError);
        throw new Error("Failed to delete payments");
      }

      // 7. Delete all notification templates for this tenant
      const { error: templatesError } = await adminSupabase
        .from("NotificationTemplate")
        .delete()
        .eq("tenantId", tenantId);

      if (templatesError) {
        console.error("Error deleting notification templates:", templatesError);
        throw new Error("Failed to delete notification templates");
      }

      // 8. Delete all scheduled notifications for this tenant
      const { error: scheduledError } = await adminSupabase
        .from("ScheduledNotification")
        .delete()
        .eq("tenantId", tenantId);

      if (scheduledError) {
        console.error("Error deleting scheduled notifications:", scheduledError);
        throw new Error("Failed to delete scheduled notifications");
      }

      // 9. Delete all settings for this tenant
      const { error: settingsError } = await adminSupabase
        .from("Setting")
        .delete()
        .eq("tenantId", tenantId);

      if (settingsError) {
        console.error("Error deleting settings:", settingsError);
        throw new Error("Failed to delete settings");
      }

      // 10. Delete all client sources for this tenant
      const { error: sourcesError } = await adminSupabase
        .from("ClientSource")
        .delete()
        .eq("tenantId", tenantId);

      if (sourcesError) {
        console.error("Error deleting client sources:", sourcesError);
        throw new Error("Failed to delete client sources");
      }

      // 11. Delete all kennel website content for this tenant
      const { error: websiteError } = await adminSupabase
        .from("kennel_websites")
        .delete()
        .eq("tenant_id", tenantId);

      if (websiteError) {
        console.error("Error deleting kennel website:", websiteError);
        throw new Error("Failed to delete kennel website");
      }

      // 12. Finally, delete the tenant itself
      const { error: deleteTenantError } = await adminSupabase
        .from("Tenant")
        .delete()
        .eq("id", tenantId);

      if (deleteTenantError) {
        console.error("Error deleting tenant:", deleteTenantError);
        throw new Error("Failed to delete tenant");
      }

      console.log(`Successfully deleted tenant: ${tenant.name} (${tenant.subdomain})`);
      console.log(`Subdomain ${tenant.subdomain} is now available for reuse`);

      return { 
        success: true, 
        message: `Tenant "${tenant.name}" and all associated data have been completely removed. Subdomain "${tenant.subdomain}" is now available for reuse.`,
        deletedTenant: tenant
      };

    } catch (deletionError) {
      console.error("Error during tenant deletion:", deletionError);
      throw new Error(`Failed to delete tenant: ${deletionError instanceof Error ? deletionError.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error("Error in tenant deletion API:", error);
    return { 
      error: error instanceof Error ? error.message : "Internal server error" 
    };
  }
});
