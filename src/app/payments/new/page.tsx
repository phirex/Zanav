"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentMethod } from "@/lib/supabase/types";
import { formatCurrency, formatDateLocale } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  status: string;
  priceType: "DAILY" | "FIXED";
  pricePerDay: number | null;
  totalPrice: number | null;
  dog: {
    id: number;
    name: string;
    owner: {
      id: number;
      name: string;
    };
  };
  payments: {
    id: number;
    amount: number;
    method: PaymentMethod;
    createdAt: string;
  }[];
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "מזומן",
  CREDIT_CARD: "אשראי",
  BANK_TRANSFER: "העברה בנקאית",
  BIT: "ביט",
};

function NewPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchBooking = async () => {
      const bookingId = searchParams.get("bookingId");
      if (!bookingId) {
        router.push("/payments");
        return;
      }

      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch booking");
        }
        const data = await response.json();
        setBooking(data);

        // Set initial amount to remaining amount
        const totalAmount =
          data.totalPrice ||
          (data.pricePerDay
            ? data.pricePerDay *
              calculateDays(new Date(data.startDate), new Date(data.endDate))
            : 0);
        const paidAmount = data.payments.reduce(
          (sum: number, payment: { amount: number }) => sum + payment.amount,
          0,
        );
        const remainingAmount = Math.max(0, totalAmount - paidAmount);
        setAmount(remainingAmount);
      } catch (error) {
        console.error("Error fetching booking:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    try {
      setSubmitting(true);
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: booking.id,
          amount,
          method,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create payment");
      }

      router.push(`/bookings/${booking.id}`);
    } catch (error) {
      console.error("Error creating payment:", error);
      alert(
        error instanceof Error
          ? error.message
          : "שגיאה ביצירת התשלום. נא לנסות שוב.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  if (!booking) {
    return <div className="text-center py-8">ההזמנה לא נמצאה</div>;
  }

  const totalAmount =
    booking.totalPrice ||
    (booking.pricePerDay
      ? booking.pricePerDay *
        calculateDays(new Date(booking.startDate), new Date(booking.endDate))
      : 0);
  const paidAmount = booking.payments.reduce(
    (sum: number, payment: { amount: number }) => sum + payment.amount,
    0,
  );
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">יצירת תשלום חדש</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">פרטי ההזמנה</h2>
        <dl className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <dt className="text-sm text-gray-500">לקוח</dt>
            <dd className="text-base font-medium text-gray-900">
              {booking.dog.owner.name}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">כלב</dt>
            <dd className="text-base font-medium text-gray-900">
              {booking.dog.name}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">תאריכים</dt>
            <dd className="text-base font-medium text-gray-900">
              {formatDateLocale(booking.startDate)} -{" "}
              {formatDateLocale(booking.endDate)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">סטטוס</dt>
            <dd className="text-base font-medium text-gray-900">
              {booking.status}
            </dd>
          </div>
        </dl>

        <dl className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <dt className="text-sm text-gray-500">סכום כולל</dt>
            <dd className="text-lg font-medium text-gray-900">
              {formatCurrency(totalAmount, i18n.language)}
            </dd>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <dt className="text-sm text-gray-500">שולם</dt>
            <dd className="text-lg font-medium text-green-600">
              {formatCurrency(paidAmount, i18n.language)}
            </dd>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <dt className="text-sm text-gray-500">יתרה לתשלום</dt>
            <dd className="text-lg font-medium text-blue-600">
              {formatCurrency(remainingAmount, i18n.language)}
            </dd>
          </div>
        </dl>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm p-6"
      >
        <h2 className="text-lg font-medium text-gray-900 mb-6">פרטי התשלום</h2>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              סכום
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={0}
              max={remainingAmount}
              step={0.01}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="method"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              אמצעי תשלום
            </label>
            <select
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(paymentMethodLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            disabled={submitting || amount <= 0 || amount > remainingAmount}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {submitting ? "יוצר תשלום..." : "צור תשלום"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Function to calculate days inclusive of both start and end dates
const calculateDays = (startDate: Date, endDate: Date): number => {
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
  return Math.round((endDateOnly - startDateOnly) / millisecondsPerDay) + 1;
};

export default function NewPaymentPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">טוען...</div>}>
      <NewPaymentForm />
    </Suspense>
  );
}
