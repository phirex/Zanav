"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PaymentHistory from "@/app/components/PaymentHistory";
import NotificationsHistory from "@/components/booking/NotificationsHistory";
import Link from "next/link";
import type { Database } from "@/lib/database.types";
import { fetchTenantCurrency, formatCurrencyIntl } from "@/lib/currency";

type PaymentMethod = Database["public"]["Enums"]["PaymentMethod"];
import { formatDateLocale } from "@/lib/utils";
import ClientLayout from "@/app/components/ClientLayout";
import { useTranslation } from "react-i18next";

interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  status: string;
  priceType: "DAILY" | "FIXED";
  pricePerDay: number | null;
  totalPrice: number | null;
  createdAt: string;
  dog: {
    id: number;
    name: string;
    owner: {
      id: number;
      name: string;
    };
  };
  payments: Payment[];
  exemptLastDay?: boolean;
  group?: { count: number; ids: number[]; dogs: string[]; anyPending: boolean };
}

interface Payment {
  id: number;
  bookingId: number;
  amount: number;
  method: PaymentMethod;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [tenantCurrency, setTenantCurrency] = useState<string>("ILS");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchTenantCurrency().then(setTenantCurrency).catch(() => setTenantCurrency("ILS"));
  }, []);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${params.id}`);
        if (!response.ok) {
          throw new Error(t("errorFetchingBooking", "Failed to fetch booking"));
        }
        const data = await response.json();
        setBooking(data);
      } catch (error) {
        console.error("Error fetching booking:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchBooking();
    }
  }, [params.id]);

  const toggleExemptLastDay = async () => {
    if (!booking) return;

    const shouldExempt = !booking.exemptLastDay;
    const actionText = shouldExempt ? t("actionRemove", "remove") : t("actionAdd", "add");

    const confirmMessage = t("confirmToggleLastDay", {
      defaultValue: "Are you sure you want to {{action}} the last day from pricing?",
      action: actionText as string,
    }) as unknown as string;

    if (!confirm(confirmMessage)) {
      return;
    }

    setToggleLoading(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/exempt-day`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ exempt: shouldExempt }),
      });

      if (!response.ok) {
        throw new Error(t("errorUpdatingBooking", "Failed to update booking"));
      }

      const updatedBooking = await response.json();
      setBooking(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      alert(t("errorUpdatingBooking", "Error updating booking"));
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t("loading", "Loading…")}</div>;
  }

  if (!booking) {
    return <div className="text-center py-8">{t("bookingNotFound", "Booking not found")}</div>;
  }

  const calculateDays = (
    startDate: string,
    endDate: string,
    exemptLastDay: boolean = false,
  ): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startDay = start.getDate();
    const startMonth = start.getMonth();
    const startYear = start.getFullYear();

    const endDay = end.getDate();
    const endMonth = end.getMonth();
    const endYear = end.getFullYear();

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const startDateOnly = new Date(startYear, startMonth, startDay).getTime();
    const endDateOnly = new Date(endYear, endMonth, endDay).getTime();
    const days = Math.round((endDateOnly - startDateOnly) / millisecondsPerDay) + 1;

    return exemptLastDay ? days - 1 : days;
  };

  const totalAmount =
    booking.totalPrice ||
    (booking.pricePerDay
      ? booking.pricePerDay *
        calculateDays(booking.startDate, booking.endDate, booking.exemptLastDay)
      : 0);

  const paidAmount = booking.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  return (
    <ClientLayout>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("bookingDetailsTitle", "Booking Details")}</h1>
          <div className="flex gap-3">
            {booking.status === "PENDING" && (
              <button
                onClick={async () => {
                  setConfirming(true);
                  try {
                    const ids = booking.group?.ids?.length ? booking.group.ids : [booking.id];
                    for (const id of ids) {
                      const res = await fetch(`/api/bookings/${id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...booking,
                          status: "CONFIRMED",
                        }),
                      });
                      if (!res.ok) throw new Error("Failed to confirm booking");
                    }
                    // Refetch primary booking
                    const refreshed = await fetch(`/api/bookings/${booking.id}`).then(r=>r.json());
                    setBooking(refreshed);
                  } catch (e) {
                    alert(t("errorUpdatingBooking", "Failed to update booking"));
                  } finally {
                    setConfirming(false);
                  }
                }}
                disabled={confirming}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {confirming ? t("confirming", "Confirming...") : t("confirmBooking", "Confirm Booking")}
              </button>
            )}
            <Link
              href={`/bookings/${booking.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Edit
            </Link>
            <Link
              href={`/payments/new?bookingId=${booking.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              New Payment
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          {booking.status === "PENDING" && (
            <div className="mb-4 p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-900 text-sm font-medium">
              {t("statusAwaitingApproval", "Awaiting Approval")} – {t("confirmBooking", "Confirm Booking")}?
            </div>
          )}
          {booking.group && booking.group.count > 1 && (
            <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">
              {t("multiDogInfo", { defaultValue: "This reservation includes {{count}} dogs: {{names}}", count: booking.group.count, names: booking.group.dogs.join(", ") }) as unknown as string}
            </div>
          )}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">{t("clientAndDog", "Client & Dog")}</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">{t("owner", "Owner")}</dt>
                  <dd className="text-base font-medium text-gray-900">{booking.dog.owner.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">{t("dog", "Dog")}</dt>
                  <dd className="text-base font-medium text-gray-900">{booking.dog.name}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">{t("bookingSection", "Booking")}</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">{t("start", "Start")}</dt>
                  <dd className="text-base font-medium text-gray-900">{formatDateLocale(booking.startDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">{t("end", "End")}</dt>
                  <dd className="text-base font-medium text-gray-900">{formatDateLocale(booking.endDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">{t("status", "Status")}</dt>
                  <dd>
                    <span className={`${booking.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : booking.status === "CONFIRMED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"} inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-semibold`}>{booking.status}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">{t("created", "Created")}</dt>
                  <dd className="text-base font-medium text-gray-900">{formatDateLocale(booking.createdAt)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t("paymentSection", "Payment")}</h2>

          {booking.priceType === "DAILY" && (
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
              <div>
                <h3 className="font-medium text-gray-900">{t("lastDayExemptTitle", "Last day exempt:")}</h3>
                <p className="text-sm text-gray-600">
                  {booking.exemptLastDay
                    ? t("lastDayNotCharged", "The last day is not charged")
                    : t("lastDayIncluded", "The last day is included")}
                </p>
              </div>
              <button
                onClick={toggleExemptLastDay}
                disabled={toggleLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50"
              >
                {toggleLoading
                  ? t("updating", "Updating…")
                  : booking.exemptLastDay
                  ? t("includeLastDay", "Include last day")
                  : t("excludeLastDay", "Exclude last day")}
              </button>
            </div>
          )}

          <dl className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <dt className="text-sm text-gray-500">{t("total", "Total")}</dt>
              <dd className="text-lg font-medium text-gray-900">{formatCurrencyIntl(totalAmount, tenantCurrency)}</dd>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <dt className="text-sm text-gray-500">{t("paid", "Paid")}</dt>
              <dd className="text-lg font-medium text-green-600">{formatCurrencyIntl(paidAmount, tenantCurrency)}</dd>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <dt className="text-sm text-gray-500">{t("remaining", "Remaining")}</dt>
              <dd className="text-lg font-medium text-blue-600">{formatCurrencyIntl(remainingAmount, tenantCurrency)}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <PaymentHistory payments={booking.payments} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <NotificationsHistory bookingId={booking.id} />
        </div>
      </div>
    </ClientLayout>
  );
}
