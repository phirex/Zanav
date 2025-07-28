import { createAdminHandler } from "@/lib/apiHandler";
import { isGlobalAdmin } from "@/lib/auth";

export const GET = createAdminHandler(async () => {
  return { isAdmin: await isGlobalAdmin() };
});
