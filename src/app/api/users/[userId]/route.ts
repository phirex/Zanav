import { createHandler } from "@/lib/apiHandler";
import { Role, hasRequiredRole, createServerSupabaseClient } from "@/lib/auth";
import { currentTenant } from "@/lib/tenant";
import { getUser, updateUserRole, removeUser } from "@/services/users";
import { ApiError } from "@/lib/apiHandler";
export { dynamic } from "@/lib/forceDynamic";

// Get details for a specific user in the tenant
export const GET = createHandler(async ({ client, params }) => {
  const ssr = await createServerSupabaseClient();
  const {
    data: { session },
  } = await ssr.auth.getSession();
  if (!session) throw new ApiError("unauthorized", "Unauthorized");
  const currentUserId = session.user.id;

  const tenantId = await currentTenant();
  const hasRole = await hasRequiredRole(currentUserId, Role.ADMIN, tenantId);
  if (!hasRole) throw new ApiError("forbidden", "Forbidden");

  const userIdParam = Array.isArray(params?.userId)
    ? params?.userId[0]
    : params?.userId;
  if (!userIdParam) throw new ApiError("missing_user_id", "userId required");
  return await getUser(client, { tenantId, userId: userIdParam });
});

// Update a user's role in the tenant
export const PUT = createHandler(async ({ client, params, body }) => {
  const ssr = await createServerSupabaseClient();
  const {
    data: { session },
  } = await ssr.auth.getSession();
  if (!session) throw new ApiError("unauthorized", "Unauthorized");
  const currentUserId = session.user.id;

  const tenantId = await currentTenant();
  const hasRole = await hasRequiredRole(currentUserId, Role.ADMIN, tenantId);
  if (!hasRole) throw new ApiError("forbidden", "Forbidden");

  const userIdParam = Array.isArray(params?.userId)
    ? params?.userId[0]
    : params?.userId;
  if (!userIdParam) throw new ApiError("missing_user_id", "userId required");
  const { role } = body;
  if (!role) throw new ApiError("missing_role", "Role required");
  return await updateUserRole(client, { tenantId, userId: userIdParam, role });
});

// Remove a user from the tenant
export const DELETE = createHandler(async ({ client, params }) => {
  const ssr = await createServerSupabaseClient();
  const {
    data: { session },
  } = await ssr.auth.getSession();
  if (!session) throw new ApiError("unauthorized", "Unauthorized");
  const currentUserId = session.user.id;

  const tenantId = await currentTenant();
  const hasRole = await hasRequiredRole(currentUserId, Role.ADMIN, tenantId);
  if (!hasRole) throw new ApiError("forbidden", "Forbidden");

  const userIdParam = Array.isArray(params?.userId)
    ? params?.userId[0]
    : params?.userId;
  if (!userIdParam) throw new ApiError("missing_user_id", "userId required");
  return await removeUser(client, {
    tenantId,
    userId: userIdParam,
    currentUserId,
  });
});
