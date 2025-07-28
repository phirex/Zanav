"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit } from "lucide-react";
import ClientLayout from "../components/ClientLayout";
import PaymentHistory from "@/app/components/PaymentHistory";
import { UnpaidBookings } from "@/app/components/UnpaidBookings";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PaymentMethod,
  Payment as SupabasePayment,
} from "@/lib/supabase/types";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/utils";

interface Owner {
  id: number;
  name: string;
  dogs: Dog[];
}

interface Dog {
  id: number;
  name: string;
  bookings: Booking[];
}

interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  status: string;
  priceType: "DAILY" | "FIXED";
  pricePerDay: number | null;
  totalPrice: number | null;
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

interface BookingWithAmounts extends Booking {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

function PaymentsContent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithAmounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/owners");
      const data = await response.json();
      setOwners(data);
    } catch (error) {
      console.error("Error fetching owners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
    // Set up an interval to refresh the data every 30 seconds
    const interval = setInterval(fetchOwners, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredOwners = owners.filter((owner) =>
    owner.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  function calculateBookingAmounts(booking: Booking): BookingWithAmounts {
    // Calculate total amount
    let totalAmount = booking.totalPrice || 0;
    if (!totalAmount && booking.priceType === "DAILY" && booking.pricePerDay) {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);

      // Calculate days by including both start and end dates
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

      // Adjust days if exemptLastDay is true
      const adjustedDays = booking.exemptLastDay ? days - 1 : days;

      totalAmount = booking.pricePerDay * adjustedDays;
    }

    // Calculate paid amount
    const paidAmount =
      booking.payments?.reduce(
        (sum: number, payment: { amount: number }) =>
          sum + (payment.amount || 0),
        0,
      ) || 0;

    // Calculate remaining amount
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    return {
      ...booking,
      totalAmount,
      paidAmount,
      remainingAmount,
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("paymentsTitle")}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={fetchOwners}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t("refreshList")}
          </button>
          {selectedBooking && (
            <Link
              href={`/payments/new?bookingId=${selectedBooking.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {t("newPayment")}
            </Link>
          )}
        </div>
      </div>

      {/* Unpaid Bookings Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t("unpaidPayments")}
        </h2>
        <UnpaidBookings />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients Selection */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {t("selectClient")}
            </h2>
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("searchClient")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-center py-4">{t("loading")}</p>
            ) : filteredOwners.length === 0 ? (
              <p className="text-center py-4 text-gray-500">
                {t("noClientsFound")}
              </p>
            ) : (
              filteredOwners.map((owner) => (
                <button
                  key={owner.id}
                  onClick={() => setSelectedOwner(owner)}
                  className={`w-full text-right p-4 rounded-xl transition-colors ${
                    selectedOwner?.id === owner.id
                      ? "bg-blue-50 border-blue-200"
                      : "hover:bg-gray-50 border-transparent"
                  } border`}
                >
                  <p className="font-medium text-gray-900">{owner.name}</p>
                  <p className="text-sm text-gray-500">
                    {t("dogsCount", { count: owner.dogs.length })},{" "}
                    {t("bookingsCount", {
                      count: owner.dogs.reduce(
                        (sum, dog) => sum + dog.bookings.length,
                        0,
                      ),
                    })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Bookings and Payment Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          {selectedOwner ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t("clientBookings", { name: selectedOwner.name })}
              </h2>
              <div className="space-y-4 mb-6">
                {selectedOwner.dogs.flatMap((dog) => dog.bookings).length ===
                0 ? (
                  <p className="text-gray-500 text-center py-2">
                    {t("noBookings")}
                  </p>
                ) : (
                  selectedOwner.dogs.flatMap((dog) =>
                    dog.bookings.map((booking) => {
                      const bookingWithAmounts =
                        calculateBookingAmounts(booking);
                      return (
                        <div
                          key={booking.id}
                          className={`border rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedBooking?.id === booking.id
                              ? "bg-blue-50 border-blue-200"
                              : "border-gray-200"
                          }`}
                          onClick={() => setSelectedBooking(bookingWithAmounts)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {dog.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(booking.startDate).toLocaleDateString(
                                  "he-IL",
                                )}{" "}
                                -{" "}
                                {new Date(booking.endDate).toLocaleDateString(
                                  "he-IL",
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <Link
                                href={`/bookings/${booking.id}`}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {t("viewBooking")}
                              </Link>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500">
                                {t("totalAmount")}
                              </p>
                              <p className="font-medium">
                                {formatCurrency(
                                  bookingWithAmounts.totalAmount,
                                  i18n.language,
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">{t("amountPaid")}</p>
                              <p className="font-medium">
                                {formatCurrency(
                                  bookingWithAmounts.paidAmount,
                                  i18n.language,
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">{t("amountDue")}</p>
                              <p className="font-medium text-red-600">
                                {formatCurrency(
                                  bookingWithAmounts.remainingAmount,
                                  i18n.language,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }),
                  )
                )}
              </div>

              {selectedBooking && (
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    {t("paymentsTitle")}
                  </h3>
                  <PaymentHistory
                    payments={selectedBooking.payments}
                    showEditButton={false}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">{t("selectClient")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <ClientLayout>
      <PaymentsContent />
    </ClientLayout>
  );
}
