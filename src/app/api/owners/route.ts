import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  listOwners,
  createOwner,
  updateOwner,
  deleteOwner,
} from "@/services/owners";
import { ApiError } from "@/lib/apiHandler";

export const GET = createHandler(async ({ tenantId }) => {
  const adminClient = supabaseAdmin();
  return await listOwners(adminClient, tenantId);
});

export const POST = createHandler(async ({ client, tenantId, body }) => {
  return await createOwner(client, tenantId, body);
});

export const PUT = createHandler(async ({ client, tenantId, body }) => {
  return await updateOwner(client, tenantId, body);
});

export const DELETE = createHandler(async ({ req, client }) => {
  const { searchParams } = new URL(req.url);
  const idParam =
    searchParams.get("id") || (req.method !== "GET" && (await req.json())?.id);
  if (!idParam) throw new ApiError("missing_owner_id", "Owner ID is required");
  const ownerId = Number(idParam);
  if (Number.isNaN(ownerId))
    throw new ApiError("invalid_owner_id", "Invalid owner ID");
  return await deleteOwner(client, ownerId);
});
