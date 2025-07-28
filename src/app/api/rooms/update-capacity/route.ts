import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { currentTenant } from "@/lib/tenant";

export async function POST(request: Request) {
  const { rooms } = await request.json();

  if (!Array.isArray(rooms)) {
    return NextResponse.json(
      { error: 'Payload must include an array "rooms"' },
      { status: 400 },
    );
  }

  const supabase = supabaseServer();

  // Determine tenant ID
  const tenantId = await currentTenant();

  // Set tenant context for RLS
  if (tenantId) {
    await supabase.rpc("set_tenant", { _tenant_id: tenantId });
  }

  // Use a transaction via RPC or run sequentially; simplest: sequential updates
  for (const room of rooms) {
    const { error } = await supabase
      .from("Room")
      .update({ maxCapacity: room.maxCapacity })
      .eq("id", room.id);

    if (error) {
      console.error("Error updating room", room.id, error);
      return NextResponse.json(
        { error: "Failed to update room capacities" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ success: true });
}
