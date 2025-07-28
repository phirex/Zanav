"use client";

import { useEffect, useState } from "react";
import { PawPrint, Plus, Calendar, User, Phone } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

interface Room {
  id: number;
  name: string;
  capacity: number;
  bookings: Booking[];
}

interface Dog {
  id: number;
  name: string;
  breed: string;
}

interface Owner {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  status: string;
  dog: Dog;
  owner: Owner;
}

interface RoomStatusProps {
  roomId: number;
}

export function RoomStatus({ roomId }: RoomStatusProps) {
  const { t } = useTranslation();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoom() {
      try {
        const response = await fetch(`/api/rooms/${roomId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch room data");
        }
        const data = await response.json();
        setRoom(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching room:", error);
        setError(t("roomInfoError"));
      } finally {
        setLoading(false);
      }
    }

    fetchRoom();
  }, [roomId, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-4 text-gray-600">
        <p>{t("roomInfoNotAvailable")}</p>
      </div>
    );
  }

  const currentBooking = room.bookings[0];

  return (
    <div>
      {currentBooking ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-blue-100 p-2">
              <PawPrint className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                {currentBooking.dog.name}
              </h4>
              <p className="text-sm text-gray-600">
                {currentBooking.dog.breed}
              </p>
            </div>
            <span className="ml-auto status-badge status-badge-occupied">
              {t("roomOccupied")}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-2" />
              {currentBooking.owner.name}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2" />
              {currentBooking.owner.phone}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              {format(new Date(currentBooking.startDate), "MMM d")} -{" "}
              {format(new Date(currentBooking.endDate), "MMM d, yyyy")}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="rounded-full bg-green-100 p-3 mx-auto mb-4 w-fit">
            <PawPrint className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-gray-900 font-medium mb-4">{t("roomAvailable")}</p>
          <button className="button-primary">
            <Plus className="h-4 w-4 mr-2" />
            {t("newBooking")}
          </button>
        </div>
      )}
    </div>
  );
}
