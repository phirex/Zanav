import { createHandler } from "@/lib/apiHandler";
import { listSettings, updateSettings } from "@/services/settings";
import { ApiError } from "@/lib/apiHandler";

// GET /api/settings - Get all settings
export const GET = createHandler(async ({ client, req }) => {
  const tenantId = req.headers.get("x-tenant-id");

  if (!tenantId) {
    console.warn(
      "[SETTINGS_API] Missing tenant ID - user may not have completed setup yet",
    );
    // Return empty settings object instead of throwing error
    return {};
  }

  try {
    const result = await listSettings(client, tenantId);
    return result;
  } catch (error: any) {
    console.error("[SETTINGS_API] Error in listSettings:", error);

    // If it's a tenant context or settings not found error, return empty object
    if (
      error.message?.includes("tenant context") ||
      error.message?.includes("not found") ||
      error.message?.includes("PGRST116")
    ) {
      return {};
    }

    // Re-throw other errors
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
