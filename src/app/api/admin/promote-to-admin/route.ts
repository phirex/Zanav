import { createAdminHandlerWithAuth } from "@/lib/apiHandler";
import { promoteSelfToGlobalAdmin } from "@/services/adminGlobal";
import { createServerSupabaseClient } from "@/lib/auth";

// POST /api/admin/promote-to-admin - Promote the current user to global admin
export const POST = createAdminHandlerWithAuth(async ({ client }) => {
  const ssrClient = await createServerSupabaseClient();
  const {
    data: { session },
  } = await ssrClient.auth.getSession();
  if (!session) throw new Error("You must be logged in");
  return await promoteSelfToGlobalAdmin(client, session as any);
});
