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
import { formatDateLocale } from "@/lib/utils";

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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">טוען...</div>
        </div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12 text-red-600">לא ניתן לטעון את פרטי הלקוח</div>
          <div className="text-center">
            <Link href="/clients" className="text-blue-600 hover:text-blue-700">חזרה לרשימת הלקוחות</Link>
          </div>
        </div>
      </div>
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/clients"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowRight className="h-5 w-5" />
              חזרה ללקוחות
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{owner.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/clients/${owner.id}/edit`}
              className="px-4 py-2 text-blue-600 hover:text-blue-700"
            >
              ערוך פרטים
            </Link>
            <Link
              href={`/bookings/new?owner=${owner.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              הזמנה חדשה
            </Link>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">פרטי לקוח</h2>
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
            <h2 className="text-xl font-bold text-gray-900">כלבים</h2>
            <Link
              href={`/clients/${owner.id}/edit?addDog=true`}
              className="text-blue-600 hover:text-blue-700"
            >
              הוסף כלב
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
                <p className="text-sm text-gray-500">גזע: {dog.breed}</p>
                {dog.specialNeeds && (
                  <p className="text-sm text-gray-500">
                    צרכים מיוחדים: {dog.specialNeeds}
                  </p>
                )}
                {dog.currentRoom && (
                  <p className="text-sm text-gray-500">
                    חדר נוכחי: {dog.currentRoom.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            הזמנות קרובות
          </h2>
          {upcomingBookings.length === 0 ? (
            <p className="text-gray-500">אין הזמנות קרובות</p>
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
                        ? `${booking.pricePerDay}₪ ליום`
                        : `${booking.totalPrice}₪ סה״כ`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/bookings/${booking.id}/edit`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      ערוך
                    </Link>
                    <button
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      מחק
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Bookings */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            הזמנות קודמות
          </h2>
          {pastBookings.length === 0 ? (
            <p className="text-gray-500">אין הזמנות קודמות</p>
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
                        {booking.dog.name} בחדר{" "}
                        {booking.room.displayName || booking.room.name}
                      </span>
                    </div>
                    <div className="text-gray-500">
                      {booking.priceType === "FIXED" && booking.totalPrice
                        ? `מחיר קבוע: ${booking.totalPrice.toLocaleString()} ₪`
                        : booking.pricePerDay
                          ? `מחיר ליום: ${booking.pricePerDay.toLocaleString()} ₪`
                          : "לא הוגדר מחיר"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/bookings/${booking.id}/edit`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      ערוך
                    </Link>
                    <button
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      מחק
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
