import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { startOfYear, endOfYear, eachMonthOfInterval, format } from "date-fns";
import { he } from "date-fns/locale";

interface Payment {
  amount: number;
  createdAt: string;
}

interface Booking {
  startDate: string;
  endDate: string;
  totalPrice: number | null;
  pricePerDay: number | null;
  payments: Payment[];
}

export async function financialReport(
  client: SupabaseClient<Database>,
  year: number,
  tenantId?: string | null,
) {
  const startDate = startOfYear(new Date(year, 0));
  const endDate = endOfYear(new Date(year, 0));
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  if (tenantId) {
    try {
      await client.rpc("set_tenant", { _tenant_id: tenantId });
    } catch {}
  }

  const { data: bookings, error } = await client
    .from("Booking")
    .select("*, payments:Payment(*)")
    .or(
      [
        `startDate.gte.${startDate.toISOString()}`,
        `startDate.lte.${endDate.toISOString()}`,
        `endDate.gte.${startDate.toISOString()}`,
        `endDate.lte.${endDate.toISOString()}`,
        `and(startDate.lte.${startDate.toISOString()},endDate.gte.${endDate.toISOString()})`,
      ].join(","),
    );
  if (error) throw new Error(error.message);

  const monthlyData = months.map((monthDate) => {
    let projectedTotal = 0;
    let actualTotal = 0;

    (bookings || []).forEach((booking: any) => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      const monthStart = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        1,
      );
      const monthEnd = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0,
      );

      if (bookingStart <= monthEnd && bookingEnd >= monthStart) {
        const overlapStart = new Date(
          Math.max(bookingStart.getTime(), monthStart.getTime()),
        );
        const overlapEnd = new Date(
          Math.min(bookingEnd.getTime(), monthEnd.getTime()),
        );
        const daysInMonth =
          Math.ceil(
            (overlapEnd.getTime() - overlapStart.getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1;

        if (booking.totalPrice) {
          const totalDays =
            Math.ceil(
              (bookingEnd.getTime() - bookingStart.getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1;
          projectedTotal += (booking.totalPrice / totalDays) * daysInMonth;
        } else if (booking.pricePerDay) {
          projectedTotal += booking.pricePerDay * daysInMonth;
        }
      }

      if (booking.payments) {
        booking.payments.forEach((p: any) => {
          // Use payment date if available, otherwise use booking start date
          const paymentDate = p.createdAt ? new Date(p.createdAt) : new Date(booking.startDate);
          if (
            paymentDate.getMonth() === monthDate.getMonth() &&
            paymentDate.getFullYear() === monthDate.getFullYear()
          ) {
            actualTotal += p.amount;
          }
        });
      }
    });

    return {
      month: format(monthDate, "MMMM", { locale: he }),
      projectedTotal: Math.round(projectedTotal),
      actualTotal: Math.round(actualTotal),
    };
  });

  return monthlyData;
}
