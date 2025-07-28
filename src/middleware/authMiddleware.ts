import { NextRequest, NextResponse } from "next/server";
import { Role, hasRequiredRole } from "@/lib/auth";
import { currentTenant } from "@/lib/tenant";

/**
 * Wraps a route handler with role-based authorization.
 * For now this is a lightweight check that relies on headers set by the middleware.
 * If the user lacks permissions it returns 403, otherwise delegates to the handler.
 */
export function withRoleAuth<
  T extends (req: any, ctx?: any) => Promise<any> | any,
>(
  handler: T,
  requiredRole: Role,
): (req: NextRequest, ctx?: any) => Promise<any> {
  return async function (request: NextRequest, context?: any) {
    try {
      const userId = request.headers.get("x-user-id") || "";
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Determine tenant id – some handlers compute internally, but we can try header
      const tenantIdHeader = request.headers.get("x-tenant-id");
      const tenantId = tenantIdHeader || (await currentTenant());

      const hasRole = await hasRequiredRole(userId, requiredRole, tenantId);
      if (!hasRole) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Delegate to original handler
      // @ts-ignore – preserve context param shape
      return await handler(request, context);
    } catch (err) {
      console.error("[withRoleAuth] Error:", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}
