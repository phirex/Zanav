import { createAdminHandlerWithAuth } from "@/lib/apiHandler";
import { createServerSupabaseClient } from "@/lib/auth";
import { debugInfo } from "@/services/adminDebug";
export { dynamic } from "@/lib/forceDynamic";

export const GET = createAdminHandlerWithAuth(async ({ client }) => {
  const ssrClient = await createServerSupabaseClient();
  const {
    data: { session },
  } = await ssrClient.auth.getSession();
  return await debugInfo(client, session);
});
