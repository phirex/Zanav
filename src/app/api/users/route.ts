import { createHandler } from "@/lib/apiHandler";
import { currentTenant } from "@/lib/tenant";
import {
  Role,
  isGlobalAdmin,
  hasRequiredRole,
  createServerSupabaseClient,
} from "@/lib/auth";
import { listUsers, addUser } from "@/services/users";
import { ApiError } from "@/lib/apiHandler";
export { dynamic } from "@/lib/forceDynamic";

// GET handler for users list (protected)
export const GET = createHandler(async ({ client }) => {
  // Determine auth session & role
  const ssr = await createServerSupabaseClient();
  const {
    data: { session },
  } = await ssr.auth.getSession();
  if (!session) throw new ApiError("unauthorized", "Unauthorized");

  const userId = session.user.id;
  const isAdminGlobal = await isGlobalAdmin();

  const tenantId = await currentTenant();
  if (!isAdminGlobal) {
    const hasRole = await hasRequiredRole(userId, Role.ADMIN, tenantId);
    if (!hasRole) throw new ApiError("forbidden", "Forbidden");
  }

  return await listUsers(client, { tenantId, isGlobalAdmin: isAdminGlobal });
});

// POST handler for adding users (protected)
export const POST = createHandler(async ({ client, body }) => {
  const ssr = await createServerSupabaseClient();
  const {
    data: { session },
  } = await ssr.auth.getSession();
  if (!session) throw new ApiError("unauthorized", "Unauthorized");
  const userId = session.user.id;

  const tenantId = await currentTenant();
  const hasRole = await hasRequiredRole(userId, Role.ADMIN, tenantId);
  if (!hasRole) throw new ApiError("forbidden", "Forbidden");

  return await addUser(client, { tenantId, ...body });
});
