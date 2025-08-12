import { createHandler } from "@/lib/apiHandler";
import { listSettings, updateSettings } from "@/services/settings";
import { ApiError } from "@/lib/apiHandler";

// GET /api/settings - Get all settings
export const GET = createHandler(async ({ client, tenantId }) => {
  if (!tenantId) {
    console.warn("[SETTINGS_API] Missing tenant ID - returning empty settings");
    return {};
  }

  try {
    const result = await listSettings(client, tenantId);
    return result;
  } catch (error: any) {
    console.error("[SETTINGS_API] Error in listSettings:", error);

    if (
      error.message?.includes("tenant context") ||
      error.message?.includes("not found") ||
      error.message?.includes("PGRST116")
    ) {
      return {};
    }

    throw error;
  }
});

// POST /api/settings - Update settings
export const POST = createHandler(async ({ client, req, tenantId, body }) => {
  console.log("[SETTINGS_API] POST request started");

  if (!tenantId) throw new ApiError("missing_tenant", "Tenant ID is required");

  console.log("[SETTINGS_API] Updating settings for tenant:", tenantId);
  const result = await updateSettings(client, tenantId, body);
  console.log("[SETTINGS_API] Update result:", result);

  return result;
});
