import { createHandler } from "@/lib/apiHandler";
import { getProfile, updateProfile } from "@/services/profile";
import { createServerSupabaseClient } from "@/lib/auth";
import { ApiError } from "@/lib/apiHandler";
export { dynamic } from "@/lib/forceDynamic";

// GET /api/profile - Get current user's profile information
export const GET = createHandler(async ({ client }) => {
  const ssr = await createServerSupabaseClient();
  const {
    data: { session },
  } = await ssr.auth.getSession();
  if (!session) throw new ApiError("unauthorized", "Unauthorized");
  return await getProfile(client, session.user.id);
});

// PATCH /api/profile - Update current user's profile
export const PATCH = createHandler(async ({ client, req, body }) => {
  const ssr = await createServerSupabaseClient();
  const {
    data: { session },
  } = await ssr.auth.getSession();
  if (!session) throw new ApiError("unauthorized", "Unauthorized");
  return await updateProfile(client, session.user.id, body);
});
