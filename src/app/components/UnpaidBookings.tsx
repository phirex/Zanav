"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/utils";

interface Owner {
  id: number;
  name: string;
  phone: string;
}

interface Dog {
  id: number;
  name: string;
  owner: Owner;
}

interface Payment {
  id: number;
  amount: number;
  method: string;
}

interface UnpaidBooking {
  id: number;
  startDate: string;
  endDate: string;
  priceType: "DAILY" | "FIXED";
  pricePerDay: number | null;
  totalPrice: number | null;
  dog: Dog;
  payments: Payment[];
  exemptLastDay?: boolean;
}

interface UnpaidBookingWithAmounts extends UnpaidBooking {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

export function UnpaidBookings() {
  const { t, i18n } = useTranslation();
  const [unpaidBookings, setUnpaidBookings] = useState<
    UnpaidBookingWithAmounts[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchUnpaidBookings = useCallback(async () => {
    try {
      setLoading(true);
      // Add a cache-busting query parameter to ensure fresh results
      const response = await fetch(`/api/bookings/unpaid?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch unpaid bookings");
      }
      const data = await response.json();

      // Calculate amounts for each booking
      const processedBookings = data.map((booking: UnpaidBooking) =>
        calculateBookingAmounts(booking),
      );

      // Sort by most recent end date first
      processedBookings.sort(
        (a: UnpaidBookingWithAmounts, b: UnpaidBookingWithAmounts) =>
          new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
      );

      setUnpaidBookings(processedBookings);
    } catch (error) {
      console.error("Error fetching unpaid bookings:", error);
      setError("Failed to load unpaid bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUnpaidBookings();
  }, [fetchUnpaidBookings]);

  function calculateBookingAmounts(
    booking: UnpaidBooking,
  ): UnpaidBookingWithAmounts {
    // Calculate days by including both start and end dates
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
    const days =
      Math.round((endDateOnly - startDateOnly) / millisecondsPerDay) + 1;

    // Adjust for exemptLastDay
    const adjustedDays = booking.exemptLastDay ? days - 1 : days;

    // Calculate total amount based on price type
    let totalAmount = 0;

    if (booking.priceType === "FIXED") {
      totalAmount = booking.totalPrice || 0;
    } else if (booking.priceType === "DAILY" && booking.pricePerDay) {
      totalAmount = booking.pricePerDay * adjustedDays;
    }

    // Calculate paid amount - sum of all payments
    const payments = booking.payments || [];
    const paidAmount = payments.reduce((sum, payment) => {
      return sum + (payment.amount || 0);
    }, 0);

    // Calculate remaining amount accurately with fixed precision
    const remainingAmount = Number((totalAmount - paidAmount).toFixed(2));

    return {
      ...booking,
      totalAmount,
      paidAmount,
      remainingAmount,
    };
  }

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUnpaidBookings();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === "en" ? "en-US" : "he-IL", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  };

  if (loading && !refreshing) {
    return (
      <div className="text-center py-4">
        {t("loadingUnpaidBookings", "טוען תשלומים שטרם שולמו...")}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        {unpaidBookings.length === 0 ? (
          <div className="text-gray-500">
            {t("noUnpaidBookings", "אין הזמנות עם תשלומים שטרם שולמו")}
          </div>
        ) : (
          <div className="text-gray-500">
            {t(
              "foundUnpaidBookings",
              "נמצאו {{count}} הזמנות עם תשלומים שטרם שולמו במלואן",
              { count: unpaidBookings.length },
            )}
          </div>
        )}
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          disabled={refreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {t("refresh", "רענן")}
        </button>
      </div>

      <div className="space-y-3">
        {unpaidBookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-red-50 border border-red-200 rounded-xl p-4 cursor-pointer hover:bg-red-100 transition-colors"
            onClick={() => router.push(`/bookings/${booking.id}`)}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* Client & Booking Info */}
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-1 ml-3 rtl:ml-3 rtl:mr-0" />
                <div className="flex-1">
                  <div className="font-medium text-base">
                    {booking.dog.owner.name} - {booking.dog.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="inline-flex items-center bg-blue-50 text-blue-700 rounded-md px-2 py-1">
                      {formatDate(booking.startDate)} -{" "}
                      {formatDate(booking.endDate)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-2">
                    <span className="inline-block bg-gray-100 rounded-md px-2 py-1">
                      <span className="font-medium">{t("bookingAmount")}:</span>{" "}
                      {formatCurrency(booking.totalAmount, i18n.language)}
                    </span>
                    <span className="inline-block bg-green-100 rounded-md px-2 py-1">
                      <span className="font-medium">{t("paid")}:</span>{" "}
                      {formatCurrency(booking.paidAmount, i18n.language)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details & Action */}
              <div className="flex flex-col md:flex-row items-center gap-3 mt-2 md:mt-0">
                <div className="bg-red-100 rounded-lg px-4 py-2 text-center md:text-right">
                  <div className="text-xs text-red-800 font-medium">
                    {t("remainingBalance")}:
                  </div>
                  <div className="font-bold text-xl text-red-700">
                    {formatCurrency(booking.remainingAmount, i18n.language)}
                  </div>
                </div>
                <Link
                  href={`/payments/new?bookingId=${booking.id}`}
                  className="w-full md:w-auto px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{t("payment", "תשלום")}</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
