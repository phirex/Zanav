import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/apiHandler";

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await request.json();
    if (!tenantId) throw new ApiError("missing_tenant", "tenantId is required");

    const res = NextResponse.json({ success: true });
    res.cookies.set("tenantId", tenantId, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  } catch (err) {
    console.error("[tenant/select] error", err);
    return NextResponse.json(
      { error: "Failed to set tenant" },
      { status: 500 },
    );
  }
}
