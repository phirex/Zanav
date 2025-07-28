import { createAdminHandler } from "@/lib/apiHandler";
import { isGlobalAdmin } from "@/lib/auth";
import { promoteSelfToGlobalAdmin } from "@/services/adminGlobal";
import { createServerSupabaseClient } from "@/lib/auth";

// GET /api/admin/global - Check if current user is a global admin
export const GET = createAdminHandler(async () => {
  return { isGlobalAdmin: await isGlobalAdmin() };
});

// POST /api/admin/global - Promote a user to global admin (dev only)
export const POST = createAdminHandler(async ({ client }) => {
  // Dev-only safeguard
  if (process.env.NODE_ENV !== "development") {
    throw new Error("This endpoint is only available in development");
  }

  // Get current session via SSR client (cookie aware)
  const ssrClient = await createServerSupabaseClient();
  const {
    data: { session },
  } = await ssrClient.auth.getSession();

  if (!session) throw new Error("You must be logged in");

  const result = await promoteSelfToGlobalAdmin(client, session as any);
  return {
    message: result.alreadyAdmin
      ? "User is already a global admin"
      : "Successfully promoted to global admin",
    ...result,
    isGlobalAdmin: true,
  };
});
