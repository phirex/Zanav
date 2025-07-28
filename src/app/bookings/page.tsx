"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatDateLocale } from "@/lib/utils";
import ClientLayout from "../components/ClientLayout";

interface Dog {
  id: number;
  name: string;
  breed: string;
  owner: {
    name: string;
    phone: string;
  };
}

interface Room {
  id: number;
  name: string;
  displayName: string;
}

interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  priceType: "DAILY" | "FIXED";
  pricePerDay: number | null;
  totalPrice: number | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  dog: Dog;
  room: Room;
  exemptLastDay: boolean;
}

export default function BookingsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // Remove month and year filtering to get all bookings
      const response = await fetch("/api/bookings");
      const data = await response.json();

      // API may return { all, upcoming, past } or an array
      const normalized = Array.isArray(data)
        ? data
        : Array.isArray(data?.all)
          ? data.all
          : [];

      console.log("Fetched bookings (normalized length):", normalized.length);
      setBookings(normalized);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleDelete = async (bookingId: number) => {
    if (!confirm(t("confirmDeleteBooking"))) {
      return;
    }

    setDeleteLoading(bookingId);
    try {
      const response = await fetch(`/api/bookings?id=${bookingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete booking");
      }

      // Refresh the bookings list
      await fetchBookings();
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert(t("errorDeletingBooking"));
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateString: string) =>
    formatDateLocale(dateString, i18n.language);

  const getStatusDisplay = (status: Booking["status"]) => {
    const statusMap = {
      PENDING: {
        text: t("statusAwaitingApproval"),
        class: "bg-yellow-100 text-yellow-800",
      },
      CONFIRMED: {
        text: t("statusApproved"),
        class: "bg-green-100 text-green-800",
      },
      CANCELLED: {
        text: t("statusCanceled"),
        class: "bg-red-100 text-red-800",
      },
    };

    const statusInfo = statusMap[status];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${statusInfo.class}`}
      >
        {statusInfo.text}
      </span>
    );
  };

  const getPriceDisplay = (booking: Booking) => {
    if (booking.priceType === "DAILY" && booking.pricePerDay) {
      // Calculate days including both start and end dates
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);

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

      // Adjust days if exemptLastDay is true
      const adjustedDays = booking.exemptLastDay ? days - 1 : days;

      return `${formatCurrency(booking.pricePerDay, i18n.language)} × ${adjustedDays} ${t("days")}`;
    }
    return booking.totalPrice
      ? formatCurrency(booking.totalPrice, i18n.language)
      : "-";
  };

  const filteredBookings = Array.isArray(bookings)
    ? bookings.filter(
        (booking) =>
          booking.dog?.name
            ?.toLowerCase()
            ?.includes(searchQuery.toLowerCase()) ||
          booking.dog?.owner?.name
            ?.toLowerCase()
            ?.includes(searchQuery.toLowerCase()) ||
          booking.dog?.owner?.phone?.includes(searchQuery) ||
          formatDate(booking.startDate).includes(searchQuery) ||
          formatDate(booking.endDate).includes(searchQuery) ||
          (booking.room?.displayName || booking.room?.name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      )
    : [];

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("bookingsTitle")}
            </h1>
            <p className="text-gray-500 mt-1">{t("bookingsSubtitle")}</p>
          </div>
          {/* Search + new button */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("searchBookings")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-10 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            <Link
              href="/bookings/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              {t("newBooking")}
            </Link>
          </div>
        </div>

        {/* Content card */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-4">{t("loading")}</div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">{t("noBookings")}</p>
                <Link
                  href="/bookings/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  {t("newBooking")}
                </Link>
              </div>
            ) : (
              <div
                className="overflow-x-auto"
                dir={i18n.language.startsWith("he") ? "rtl" : "ltr"}
              >
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        {t("dogName")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        {t("dogOwner")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        {t("entryDate")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        {t("exitDate")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        {t("room")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        {t("status")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        {t("price")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        {t("tableHeaderActions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b border-gray-200 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/bookings/${booking.id}`)}
                      >
                        <td className="py-4 px-4 text-right">
                          {booking.dog.name}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div>
                            <div className="font-medium">
                              {booking.dog.owner.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.dog.owner.phone}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {formatDate(booking.startDate)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {formatDate(booking.endDate)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {booking.room.displayName || booking.room.name}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {getStatusDisplay(booking.status)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {getPriceDisplay(booking)}
                        </td>
                        <td
                          className="py-4 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/bookings/${booking.id}/edit`);
                              }}
                              className="text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              {t("edit")}
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(booking.id);
                              }}
                              disabled={deleteLoading === booking.id}
                              className={`text-red-600 hover:text-red-700 transition-colors ${deleteLoading === booking.id ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              {deleteLoading === booking.id
                                ? t("deleting")
                                : t("delete")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
