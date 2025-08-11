import { createAdminHandlerWithAuth } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createAdminHandlerWithAuth(async () => {
  try {
    const adminSupabase = supabaseAdmin();

    // Get all users with their tenant information
    const { data: users, error: usersError } = await adminSupabase
      .from("User")
      .select(`
        id,
        email,
        name,
        createdAt,
        tenantId,
        UserTenant(
          role,
          tenant_id,
          Tenant(
            name
          )
        )
      `)
      .order("createdAt", { ascending: false });

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw new Error("Failed to fetch users");
    }

    // Transform the data to a cleaner format
    const transformedUsers = users?.map(user => {
      // Get the first user-tenant relationship (most users will have one)
      const userTenant = user.UserTenant?.[0];
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        tenantId: user.tenantId,
        tenantName: userTenant?.Tenant?.name || 'No tenant',
        role: userTenant?.role || 'No role'
      };
    }) || [];

    console.log("Fetched users:", transformedUsers.length, "users found");
    return { users: transformedUsers };

  } catch (error) {
    console.error("Error in all-users API:", error);
    return { users: [] };
  }
}); 