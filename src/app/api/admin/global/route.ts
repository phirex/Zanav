import { createAdminHandlerWithAuth } from "@/lib/apiHandler";
import { isGlobalAdmin, createServerSupabaseClient } from "@/lib/auth";
import { promoteSelfToGlobalAdmin } from "@/services/adminGlobal";

// GET /api/admin/global - Check if current user is a global admin
export const GET = createAdminHandlerWithAuth(async () => {
  return { isGlobalAdmin: await isGlobalAdmin() };
});

// POST /api/admin/global - Promote a user to global admin (dev only)
export const POST = createAdminHandlerWithAuth(async ({ client }) => {
  // Dev-only safeguard
  if (process.env.NODE_ENV !== "development") {
    throw new Error("This endpoint is only available in development");
  }

  const ssrClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Create session object that promoteSelfToGlobalAdmin expects
  const session = {
    user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata
    }
  };

  return await promoteSelfToGlobalAdmin(client, session);
});
