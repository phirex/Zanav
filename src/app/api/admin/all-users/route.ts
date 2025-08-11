import { createAdminHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = createAdminHandler(async () => {
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
        UserTenant!inner(
          role,
          tenant_id
        ),
        Tenant!inner(
          name
        )
      `)
      .order("createdAt", { ascending: false });

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw new Error("Failed to fetch users");
    }

    // Transform the data to a cleaner format
    const transformedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      tenantId: user.tenantId,
      tenantName: user.Tenant?.name,
      role: user.UserTenant?.[0]?.role
    })) || [];

    return { users: transformedUsers };

  } catch (error) {
    console.error("Error in all-users API:", error);
    return { users: [] };
  }
}); 