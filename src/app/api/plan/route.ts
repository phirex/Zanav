import { NextRequest, NextResponse } from "next/server";
import { createHandler } from "@/lib/apiHandler";
import { getPlanInfo } from "@/lib/plan";

export const GET = createHandler(async ({ tenantId }) => {
  if (!tenantId)
    return NextResponse.json({ error: "No tenant" }, { status: 400 });
  const info = await getPlanInfo(tenantId);
  return info;
});
