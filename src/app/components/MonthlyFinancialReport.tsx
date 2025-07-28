"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/utils";

interface MonthlyData {
  month: string;
  projected: number;
  actual: number;
}

export function MonthlyFinancialReport() {
  const { t, i18n } = useTranslation();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setLoading(true);
        const currentDate = new Date();
        const data: MonthlyData[] = [];

        // Fetch last 6 months of data
        for (let i = 0; i < 6; i++) {
          const date = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - i,
            1,
          );
          const month = date.getMonth() + 1;
          const year = date.getFullYear();

          const response = await fetch(
            `/api/bookings?month=${month}&year=${year}`,
          );
          const bookingsResponse = await response.json();

          // Handle API response structure { upcoming, past, all }
          const bookings = bookingsResponse?.all || [];

          let projectedTotal = 0;
          let actualTotal = 0;

          bookings.forEach((booking: any) => {
            // Calculate projected income
            if (booking.totalPrice) {
              projectedTotal += booking.totalPrice;
            } else if (booking.pricePerDay) {
              const startDate = new Date(booking.startDate);
              const endDate = new Date(booking.endDate);
              const days = Math.ceil(
                (endDate.getTime() - startDate.getTime()) /
                  (1000 * 60 * 60 * 24),
              );
              projectedTotal += booking.pricePerDay * days;
            }

            // Calculate actual income from payments
            if (booking.payments) {
              actualTotal += booking.payments.reduce(
                (
                  sum: number,
                  payment: { amount: number; createdAt: string },
                ) => {
                  const paymentDate = new Date(payment.createdAt);
                  if (
                    paymentDate.getMonth() === date.getMonth() &&
                    paymentDate.getFullYear() === date.getFullYear()
                  ) {
                    return sum + payment.amount;
                  }
                  return sum;
                },
                0,
              );
            }
          });

          data.push({
            month: new Intl.DateTimeFormat(
              i18n.language.startsWith("en") ? "en-US" : "he-IL",
              { month: "long", year: "numeric" },
            ).format(date),
            projected: projectedTotal,
            actual: actualTotal,
          });
        }

        setMonthlyData(data.reverse());
      } catch (error) {
        console.error("Error fetching monthly data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-medium mb-6">
          {t("monthlyReport", "דוח חודשי")}
        </h2>
        <div className="text-center py-4">{t("loading", "טוען...")}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-medium mb-6">
        {t("monthlyReport", "דוח חודשי")}
      </h2>
      <div className="space-y-4">
        {monthlyData.map((data, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
          >
            <div className="font-medium">{data.month}</div>
            <div className="flex items-center gap-8">
              <div>
                <div className="text-sm text-gray-500">
                  {t("projected", "צפי")}
                </div>
                <div className="font-medium">
                  {formatCurrency(data.projected, i18n.language)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">
                  {t("actual", "בפועל")}
                </div>
                <div className="font-medium text-green-600">
                  {formatCurrency(data.actual, i18n.language)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
