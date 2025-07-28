"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PaymentHistory from "@/app/components/PaymentHistory";
import NotificationsHistory from "@/components/booking/NotificationsHistory";
import Link from "next/link";
import { PaymentMethod } from "@/lib/supabase/types";
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
  createdAt: string;
  updatedAt: string;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

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

  // Add function to toggle exemptLastDay
  const toggleExemptLastDay = async () => {
    if (!booking) return;

    const shouldExempt = !booking.exemptLastDay;
    const actionText = shouldExempt ? "להסיר" : "להוסיף";

    if (
      !confirm(`האם אתה בטוח שברצונך ${actionText} את היום האחרון מהחישוב?`)
    ) {
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

      // Refresh booking data
      const updatedBooking = await response.json();
      setBooking(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("שגיאה בעדכון ההזמנה");
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  if (!booking) {
    return <div className="text-center py-8">ההזמנה לא נמצאה</div>;
  }

  // Update calculate days function to consider exemptLastDay
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

    // Calculate diff in days and add 1 to include both start and end dates
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const startDateOnly = new Date(startYear, startMonth, startDay).getTime();
    const endDateOnly = new Date(endYear, endMonth, endDay).getTime();
    const days =
      Math.round((endDateOnly - startDateOnly) / millisecondsPerDay) + 1;

    // If exemptLastDay is true, subtract 1 day
    return exemptLastDay ? days - 1 : days;
  };

  const totalAmount =
    booking.totalPrice ||
    (booking.pricePerDay
      ? booking.pricePerDay *
        calculateDays(booking.startDate, booking.endDate, booking.exemptLastDay)
      : 0);

  const paidAmount = booking.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">פרטי הזמנה</h1>
        <div className="flex gap-4">
          <Link
            href={`/bookings/${booking.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            עריכה
          </Link>
          <Link
            href={`/payments/new?bookingId=${booking.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            תשלום חדש
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              פרטי הלקוח והכלב
            </h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">שם הלקוח</dt>
                <dd className="text-base font-medium text-gray-900">
                  {booking.dog.owner.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">שם הכלב</dt>
                <dd className="text-base font-medium text-gray-900">
                  {booking.dog.name}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              פרטי ההזמנה
            </h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">תאריך התחלה</dt>
                <dd className="text-base font-medium text-gray-900">
                  {formatDateLocale(booking.startDate)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">תאריך סיום</dt>
                <dd className="text-base font-medium text-gray-900">
                  {formatDateLocale(booking.endDate)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">סטטוס</dt>
                <dd className="text-base font-medium text-gray-900">
                  {booking.status}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">נוצר בתאריך</dt>
                <dd className="text-base font-medium text-gray-900">
                  {formatDateLocale(booking.createdAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">פרטי תשלום</h2>

        {/* Display exempt last day status */}
        {booking.priceType === "DAILY" && (
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
            <div>
              <h3 className="font-medium text-gray-900">
                יום אחרון פטור מתשלום:
              </h3>
              <p className="text-sm text-gray-600">
                {booking.exemptLastDay
                  ? "היום האחרון אינו נכלל בחישוב"
                  : "היום האחרון נכלל בחישוב"}
              </p>
            </div>
            <button
              onClick={toggleExemptLastDay}
              disabled={toggleLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50"
            >
              {toggleLoading
                ? "מעדכן..."
                : booking.exemptLastDay
                  ? "הוסף יום אחרון"
                  : "הסר יום אחרון"}
            </button>
          </div>
        )}

        <dl className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <dt className="text-sm text-gray-500">סכום כולל</dt>
            <dd className="text-lg font-medium text-gray-900">
              ₪{totalAmount.toLocaleString()}
            </dd>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <dt className="text-sm text-gray-500">שולם</dt>
            <dd className="text-lg font-medium text-green-600">
              ₪{paidAmount.toLocaleString()}
            </dd>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <dt className="text-sm text-gray-500">יתרה לתשלום</dt>
            <dd className="text-lg font-medium text-blue-600">
              ₪{remainingAmount.toLocaleString()}
            </dd>
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
