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

export const POST = createHandler(async ({ tenantId, body }) => {
  const adminClient = supabaseAdmin();
  return await createOwner(adminClient, tenantId, body);
});

export const PUT = createHandler(async ({ tenantId, body }) => {
  const adminClient = supabaseAdmin();
  return await updateOwner(adminClient, tenantId, body);
});

export const DELETE = createHandler(async ({ req }) => {
  const client = supabaseAdmin();
  const { searchParams } = new URL(req.url);
  const idParam =
    searchParams.get("id") || (req.method !== "GET" && (await req.json())?.id);
  if (!idParam) throw new ApiError("missing_owner_id", "Owner ID is required");
  const ownerId = Number(idParam);
  if (Number.isNaN(ownerId))
    throw new ApiError("invalid_owner_id", "Invalid owner ID");
  return await deleteOwner(client, ownerId);
});
