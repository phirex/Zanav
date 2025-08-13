"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Plus,
  Dog as DogIcon,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { formatDateLocale, formatCurrency } from "@/lib/utils";
import ClientLayout from "@/app/components/ClientLayout";
import { useTranslation } from "react-i18next";

interface Dog {
  id: number;
  name: string;
  breed: string;
  specialNeeds: string;
  currentRoom?: {
    id: number;
    name: string;
  };
}

interface Room {
  id: number;
  name: string;
  displayName?: string;
}

interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  status: string;
  priceType: "DAILY" | "FIXED";
  pricePerDay: number | null;
  totalPrice: number | null;
  dog: Dog;
  room: Room;
  payments: any[];
}

interface Owner {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  dogs: Dog[];
  bookings: Booking[];
}

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchOwner = async () => {
      try {
        const response = await fetch(`/api/owners/${params.id}`);
        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          const message = errorPayload?.error?.message || `Failed to fetch owner (${response.status})`;
          throw new Error(message);
        }
        const data = await response.json();
        setOwner(data);
      } catch (error) {
        console.error("Error fetching owner:", error);
        setOwner(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOwner();
    }
  }, [params.id]);

  const handleDeleteBooking = async (bookingId: number) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק הזמנה זו?")) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings?id=${bookingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh owner data to get updated bookings
        const ownerResponse = await fetch(`/api/owners/${params.id}`);
        const ownerData = await ownerResponse.json();
        setOwner(ownerData);
      } else {
        alert("שגיאה במחיקת ההזמנה");
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("שגיאה במחיקת ההזמנה");
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">{t("loading", "Loading...")}</div>
        </div>
      </ClientLayout>
    );
  }

  if (!owner) {
    return (
      <ClientLayout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12 text-red-600">{t("errorLoadingClientDetails", "Unable to load client details")}</div>
          <div className="text-center">
            <Link href="/clients" className="text-blue-600 hover:text-blue-700">{t("backToClients", "Back to Clients")}</Link>
          </div>
        </div>
      </ClientLayout>
    );
  }

  const upcomingBookings = owner.bookings
    .filter((booking) => new Date(booking.startDate) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

  const pastBookings = owner.bookings
    .filter((booking) => new Date(booking.startDate) < new Date())
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );

  return (
    <ClientLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/clients"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowRight className="h-5 w-5" />
              {t("backToClients", "Back to Clients")}
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{owner.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/clients/${owner.id}/edit`}
              className="px-4 py-2 text-blue-600 hover:text-blue-700"
            >
              {t("editClient", "Edit Client")}
            </Link>
            <Link
              href={`/bookings/new?owner=${owner.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              {t("newBooking", "New Booking")}
            </Link>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("clientInformation", "Client Information")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="h-5 w-5" />
              <span>{owner.phone}</span>
            </div>
            {owner.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-5 w-5" />
                <span>{owner.email}</span>
              </div>
            )}
            {owner.address && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-5 w-5" />
                <span>{owner.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dogs */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{t("dogs", "Dogs")}</h2>
            <Link
              href={`/clients/${owner.id}/edit?addDog=true`}
              className="text-blue-600 hover:text-blue-700"
            >
              {t("addDog", "Add Dog")}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {owner.dogs.map((dog) => (
              <div
                key={dog.id}
                className="p-4 border border-gray-200 rounded-xl space-y-2"
              >
                <div className="flex items-center gap-2">
                  <DogIcon className="h-5 w-5 text-gray-400" />
                  <h3 className="font-medium">{dog.name}</h3>
                </div>
                <p className="text-sm text-gray-500">{t("breed", "Breed")}: {dog.breed}</p>
                {dog.specialNeeds && (
                  <p className="text-sm text-gray-500">
                    {t("specialNeeds", "Special Needs")}: {dog.specialNeeds}
                  </p>
                )}
                {dog.currentRoom && (
                  <p className="text-sm text-gray-500">
                    {t("currentRoom", "Current Room")}: {dog.currentRoom.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("upcomingBookingsTitle", "Upcoming Bookings")}</h2>
          {upcomingBookings.length === 0 ? (
            <p className="text-gray-500">{t("noUpcomingBookings", "No upcoming bookings")}</p>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">
                        {formatDateLocale(booking.startDate)} -{" "}
                        {formatDateLocale(booking.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <DogIcon className="h-5 w-5" />
                      <span>
                        {booking.dog.name} | {booking.room.name}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.priceType === "DAILY"
                        ? `${formatCurrency(booking.pricePerDay || 0, i18n.language)} ${t("perDay", "per day")}`
                        : `${formatCurrency(booking.totalPrice || 0, i18n.language)} ${t("total", "Total")}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/bookings/${booking.id}/edit`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {t("edit", "Edit")}
                    </Link>
                    <button
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      {t("delete", "Delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Bookings */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("pastBookingsTitle", "Past Bookings")}</h2>
          {pastBookings.length === 0 ? (
            <p className="text-gray-500">{t("noPastBookings", "No past bookings")}</p>
          ) : (
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 border border-gray-200 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1 mb-3 md:mb-0">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">
                        {formatDateLocale(booking.startDate)} -{" "}
                        {formatDateLocale(booking.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <DogIcon className="h-5 w-5" />
                      <span>
                        {booking.dog.name} {t("inRoom", "in room")} {booking.room.displayName || booking.room.name}
                      </span>
                    </div>
                    <div className="text-gray-500">
                      {booking.priceType === "FIXED" && booking.totalPrice
                        ? `${t("fixedPrice", "Fixed Price")}: ${formatCurrency(booking.totalPrice, i18n.language)}`
                        : booking.pricePerDay
                          ? `${t("dailyRate", "Daily Rate")}: ${formatCurrency(booking.pricePerDay, i18n.language)}`
                          : t("priceNotSet", "Price not set")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/bookings/${booking.id}/edit`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {t("edit", "Edit")}
                    </Link>
                    <button
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      {t("delete", "Delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
