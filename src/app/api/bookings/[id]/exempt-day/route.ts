import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const { exempt } = await request.json();

    const supabase = supabaseServer();

    // Fetch the booking to get current price information
    const { data: booking, error: fetchError } = await supabase
      .from("Booking")
      .select("*")
      .eq("id", parseInt(id))
      .single();

    if (fetchError || !booking) {
      console.error("Error fetching booking:", fetchError);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Only apply to daily rate bookings
    if (booking.priceType !== "DAILY" || !booking.pricePerDay) {
      return NextResponse.json(
        { error: "Can only exempt day for daily rate bookings" },
        { status: 400 },
      );
    }

    // Calculate days with or without the exemption
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);

    const startDay = startDate.getDate();
    const startMonth = startDate.getMonth();
    const startYear = startDate.getFullYear();

    const endDay = endDate.getDate();
    const endMonth = endDate.getMonth();
    const endYear = endDate.getFullYear();

    // Calculate diff in days and add 1 to include both start and end dates
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const startDateOnly = new Date(startYear, startMonth, startDay).getTime();
    const endDateOnly = new Date(endYear, endMonth, endDay).getTime();
    const totalDays =
      Math.round((endDateOnly - startDateOnly) / millisecondsPerDay) + 1;

    // Calculate days excluding last day if exempt is true
    const days = exempt ? totalDays - 1 : totalDays;

    // Calculate new total price
    const newTotalPrice = booking.pricePerDay * days;

    // Update booking with new exemption status and total price
    const { data: updatedBooking, error: updateError } = await supabase
      .from("Booking")
      .update({
        exemptLastDay: exempt,
        totalPrice: newTotalPrice,
      })
      .eq("id", parseInt(id))
      .select(
        `*, 
        dog:Dog(*, owner:Owner(*)),
        payments:Payment(*)
      `,
      )
      .single();

    if (updateError) {
      console.error("Error updating booking:", updateError);
      return NextResponse.json(
        { error: "Failed to update booking" },
        { status: 500 },
      );
    }

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Error updating booking exempt day status:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 },
    );
  }
}
