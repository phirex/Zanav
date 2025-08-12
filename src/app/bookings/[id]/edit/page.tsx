"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ClientLayout from "@/app/components/ClientLayout";

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
}

export default function EditBookingPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    roomId: "",
    priceType: "",
    pricePerDay: "",
    totalPrice: "",
    status: "",
  });

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const [bookingResponse, roomsResponse] = await Promise.all([
          fetch(`/api/bookings/${params.id}`),
          fetch("/api/rooms"),
        ]);

        if (!bookingResponse.ok) {
          throw new Error("Failed to fetch booking");
        }

        const bookingData = await bookingResponse.json();
        const roomsData = await roomsResponse.json();

        setBooking(bookingData);
        setRooms(roomsData);

        // Format dates for input fields (YYYY-MM-DD)
        const startDate = new Date(bookingData.startDate);
        const endDate = new Date(bookingData.endDate);

        setFormData({
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          roomId: bookingData.room.id.toString(),
          priceType: bookingData.priceType,
          pricePerDay: bookingData.pricePerDay?.toString() || "",
          totalPrice: bookingData.totalPrice?.toString() || "",
          status: bookingData.status,
        });
      } catch (error) {
        console.error("Error fetching booking:", error);
        alert("שגיאה בטעינת ההזמנה");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/bookings/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          roomId: parseInt(formData.roomId),
          pricePerDay: formData.pricePerDay
            ? parseFloat(formData.pricePerDay)
            : null,
          totalPrice: formData.totalPrice
            ? parseFloat(formData.totalPrice)
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update booking");
      }

      router.push(`/bookings/${params.id}`);
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("שגיאה בעדכון ההזמנה");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4">טוען...</p>
          </div>
        </div>
      </ClientLayout>
    );
  }

  if (!booking) {
    return (
      <ClientLayout>
        <div className="text-center py-12">
          <p className="text-red-600">ההזמנה לא נמצאה</p>
          <Link
            href="/bookings"
            className="text-blue-600 hover:text-blue-700 mt-4 inline-block"
          >
            חזור להזמנות
          </Link>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowRight className="h-5 w-5" />
          חזרה להזמנות
        </Link>
        <h1 className="text-2xl font-bold">עריכת הזמנה - {booking.dog.name}</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תאריך כניסה
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תאריך יציאה
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                חדר
              </label>
              <select
                value={formData.roomId}
                onChange={(e) =>
                  setFormData({ ...formData, roomId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">בחר חדר</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.displayName || room.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סטטוס
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="PENDING">ממתין</option>
                <option value="CONFIRMED">מאושר</option>
                <option value="CANCELLED">מבוטל</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סוג מחיר
              </label>
              <select
                value={formData.priceType}
                onChange={(e) =>
                  setFormData({ ...formData, priceType: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="DAILY">יומי</option>
                <option value="FIXED">קבוע</option>
              </select>
            </div>

            {formData.priceType === "DAILY" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מחיר ליום
                </label>
                <input
                  type="number"
                  value={formData.pricePerDay}
                  onChange={(e) =>
                    setFormData({ ...formData, pricePerDay: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מחיר כולל
                </label>
                <input
                  type="number"
                  value={formData.totalPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, totalPrice: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/bookings"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ביטול
            </Link>
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                saving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {saving ? "שומר..." : "שמור שינויים"}
            </button>
          </div>
        </form>
      </div>
    </ClientLayout>
  );
}
