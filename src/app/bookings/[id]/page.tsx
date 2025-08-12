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
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [tenantCurrency, setTenantCurrency] = useState<string>("ILS");

  useEffect(() => {
    fetchTenantCurrency().then(setTenantCurrency).catch(() => setTenantCurrency("ILS"));
  }, []);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch booking");
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
    const actionText = shouldExempt ? "remove" : "add";

    if (!confirm(`Are you sure you want to ${actionText} the last day from pricing?`)) {
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
        throw new Error("Failed to update booking");
      }

      const updatedBooking = await response.json();
      setBooking(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Error updating booking");
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading…</div>;
  }

  if (!booking) {
    return <div className="text-center py-8">Booking not found</div>;
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
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
        <div className="flex gap-4">
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
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Client & Dog</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Owner</dt>
                <dd className="text-base font-medium text-gray-900">{booking.dog.owner.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Dog</dt>
                <dd className="text-base font-medium text-gray-900">{booking.dog.name}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Booking</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Start</dt>
                <dd className="text-base font-medium text-gray-900">{formatDateLocale(booking.startDate)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">End</dt>
                <dd className="text-base font-medium text-gray-900">{formatDateLocale(booking.endDate)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd className="text-base font-medium text-gray-900">{booking.status}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-base font-medium text-gray-900">{formatDateLocale(booking.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Payment</h2>

        {booking.priceType === "DAILY" && (
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
            <div>
              <h3 className="font-medium text-gray-900">Last day exempt:</h3>
              <p className="text-sm text-gray-600">
                {booking.exemptLastDay ? "The last day is not charged" : "The last day is included"}
              </p>
            </div>
            <button
              onClick={toggleExemptLastDay}
              disabled={toggleLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50"
            >
              {toggleLoading ? "Updating…" : booking.exemptLastDay ? "Include last day" : "Exclude last day"}
            </button>
          </div>
        )}

        <dl className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <dt className="text-sm text-gray-500">Total</dt>
            <dd className="text-lg font-medium text-gray-900">{formatCurrencyIntl(totalAmount, tenantCurrency)}</dd>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <dt className="text-sm text-gray-500">Paid</dt>
            <dd className="text-lg font-medium text-green-600">{formatCurrencyIntl(paidAmount, tenantCurrency)}</dd>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <dt className="text-sm text-gray-500">Remaining</dt>
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
  );
}
