"use client";

import { useState, useEffect } from "react";
import ClientLayout from "../components/ClientLayout";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { he, enUS } from "date-fns/locale";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { fetchWithTenant } from "@/lib/client-tenant";
import { useTranslation } from "react-i18next";

interface Room {
  id: number;
  displayName: string;
  capacity: number;
  maxCapacity: number;
}

interface Dog {
  id: number;
  name: string;
  ownerId: number;
  owner: {
    name: string;
    phone: string;
  };
}

interface Booking {
  id: number;
  roomId: number;
  startDate: string;
  endDate: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  dog: Dog;
}

interface DayRoomStatus {
  room: Room;
  occupancy: number;
  percentage: number;
  status: "green" | "yellow" | "red";
  bookings: Booking[];
}

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  roomStatuses: DayRoomStatus[];
}

function MonthNavigator({
  currentDate,
  onNavigate,
}: {
  currentDate: Date;
  onNavigate: (date: Date) => void;
}) {
  const { i18n, t } = useTranslation();
  const locale = i18n.language.startsWith("en") ? enUS : he;
  const isRTL = !i18n.language.startsWith("en");

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentDate.getFullYear(), i, 1);
    return {
      value: i,
      label: format(date, "MMMM", { locale }),
    };
  });

  const years = Array.from({ length: 3 }, (_, i) => {
    const year = currentDate.getFullYear() - 1 + i;
    return {
      value: year,
      label: year.toString(),
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
        <button
          onClick={() => onNavigate(subMonths(currentDate, 1))}
          className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
        >
          {isRTL ? (
            <ChevronRight className="h-6 w-6 text-gray-600" />
          ) : (
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <select
            value={currentDate.getMonth()}
            onChange={(e) => {
              const newDate = new Date(currentDate);
              newDate.setMonth(parseInt(e.target.value));
              onNavigate(newDate);
            }}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>

          <select
            value={currentDate.getFullYear()}
            onChange={(e) => {
              const newDate = new Date(currentDate);
              newDate.setFullYear(parseInt(e.target.value));
              onNavigate(newDate);
            }}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          >
            {years.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onNavigate(addMonths(currentDate, 1))}
          className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
        >
          {isRTL ? (
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          ) : (
            <ChevronRight className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      <button
        onClick={() => onNavigate(new Date())}
        className="px-4 py-2 text-base text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full sm:w-auto"
      >
        {t("today", "Today")}
      </button>
    </div>
  );
}

function DayDetailsModal({
  isOpen,
  onClose,
  date,
  roomStatuses,
}: DayDetailsModalProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("en") ? enUS : he;

  if (!isOpen) return null;

  const selectedDateString = format(date, "yyyy-MM-dd");

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-xl max-w-2xl mx-auto shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="pt-14 pb-8 px-6 sm:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {format(date, "EEEE, d MMMM yyyy", { locale })}
          </h2>

          {/* Rooms status */}
          <div>
            <h3 className="text-base font-semibold text-blue-600 mb-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z"
                  clipRule="evenodd"
                />
              </svg>
              {t("dogsByRoom")}
            </h3>
            <div className="space-y-4">
              {roomStatuses.map((status) => {
                // Filter out dogs leaving today for the actual count
                const actualOccupancy = status.bookings.filter((booking) => {
                  const endDateStr = booking.endDate
                    ? booking.endDate.substring(0, 10)
                    : "";
                  return endDateStr !== selectedDateString;
                }).length;

                return (
                  <div
                    key={status.room.id}
                    className="border border-gray-200 rounded-xl p-3 sm:p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">
                        {status.room.displayName}
                      </h3>
                      <span
                        className={`text-xs sm:text-sm px-2 py-1 rounded-lg font-medium ${
                          status.status === "green"
                            ? "bg-green-100 text-green-800"
                            : status.status === "yellow"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {actualOccupancy}/{status.room.maxCapacity}
                      </span>
                    </div>

                    {status.bookings.length > 0 ? (
                      <div className="space-y-2">
                        {status.bookings.map((booking) => {
                          const isLeavingToday =
                            booking.endDate &&
                            booking.endDate.substring(0, 10) ===
                              selectedDateString;
                          const isArrivingToday =
                            booking.startDate &&
                            booking.startDate.substring(0, 10) ===
                              selectedDateString;

                          return (
                            <div
                              key={booking.id}
                              className={`${isLeavingToday ? "bg-orange-50 border border-orange-100" : "bg-gray-50"} rounded-lg p-3`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <div className="flex items-center">
                                    <p className="font-medium text-gray-900">
                                      {booking.dog.name}
                                    </p>
                                    {isLeavingToday && (
                                      <span className="ml-2 text-xs font-medium px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded">
                                        {t("leavingToday")}
                                      </span>
                                    )}
                                    {isArrivingToday && (
                                      <span className="ml-2 text-xs font-medium px-1.5 py-0.5 bg-green-100 text-green-800 rounded">
                                        {t("arrivingToday")}
                                      </span>
                                    )}
                                    {booking.status !== "CONFIRMED" && (
                                      <span className="ml-2 text-xs font-medium px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                                        {t("statusPending", "Pending")}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                                    <span>{booking.dog.owner.name}</span>
                                    <span>•</span>
                                    <a
                                      href={`tel:${booking.dog.owner.phone}`}
                                      className="text-blue-600 hover:underline"
                                    >
                                      {booking.dog.owner.phone}
                                    </a>
                                  </div>
                                </div>
                                <div className="text-xs sm:text-sm px-2 py-1 bg-gray-100 rounded-lg text-gray-600 self-start sm:self-auto">
                                  {format(new Date(booking.startDate), "dd/MM")}{" "}
                                  - {format(new Date(booking.endDate), "dd/MM")}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {t("noBookingsForRoom")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarContent() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("en") ? enUS : he;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const fetchData = async () => {
    try {
      // Use fetchWithTenant to get rooms and bookings
      const [roomsData, bookingsData] = await Promise.all([
        fetchWithTenant<Room[]>("/api/rooms"),
        fetchWithTenant<
          | Booking[]
          | { all?: Booking[]; upcoming?: Booking[]; past?: Booking[] }
        >(
          `/api/bookings?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`,
        ),
      ]);

      // Add safeguards for invalid data
      if (Array.isArray(roomsData)) {
        setRooms(roomsData);
      } else {
        console.error("Invalid rooms data format:", roomsData);
        setRooms([]);
      }

      if (Array.isArray(bookingsData)) {
        setBookings(bookingsData);
      } else if (
        bookingsData &&
        typeof bookingsData === "object" &&
        "all" in bookingsData &&
        Array.isArray((bookingsData as any).all)
      ) {
        setBookings((bookingsData as any).all as Booking[]);
      } else {
        console.error("Invalid bookings data format:", bookingsData);
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setRooms([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const getDayStatus = (
    date: Date,
    includeAllDogs = false,
  ): DayRoomStatus[] => {
    // Create a clone of the date to prevent mutation issues
    const currentDate = new Date(date.getTime());
    currentDate.setHours(0, 0, 0, 0);

    // Format as YYYY-MM-DD for string comparison
    const dateString = format(currentDate, "yyyy-MM-dd");

    // Check if rooms is undefined or not an array
    if (!rooms || !Array.isArray(rooms)) {
      console.error("Rooms data is not available or not an array:", rooms);
      return [];
    }

    return rooms.map((room) => {
      const dayBookings = bookings.filter((booking) => {
        // Convert booking dates to YYYY-MM-DD format for comparison
        const startDateStr = booking.startDate
          ? booking.startDate.substring(0, 10)
          : "";
        const endDateStr = booking.endDate
          ? booking.endDate.substring(0, 10)
          : "";

        // Check if:
        // 1. The booking is for this room and
        // 2. For counting purposes: The current day is within the booking range but not if it's the end date
        // 3. For modal display purposes: Include all dogs within the booking range
        return (
          booking.roomId === room.id &&
          startDateStr &&
          endDateStr && // Make sure dates exist
          dateString >= startDateStr &&
          (includeAllDogs
            ? dateString <= endDateStr // For modal display, show all dogs including those leaving
            : dateString < endDateStr ||
              (dateString === endDateStr &&
                hasBookingTimeData(booking.endDate)))
        );
      });

      // Count only confirmed bookings for occupancy calculations
      const confirmedDayBookings = dayBookings.filter(
        (b) => b.status === "CONFIRMED",
      );
      const occupancy = confirmedDayBookings.length;
      const percentage = (occupancy / room.maxCapacity) * 100;

      let status: "green" | "yellow" | "red" = "green";
      if (percentage >= 100) status = "red";
      else if (percentage >= 30) status = "yellow";

      return {
        room,
        occupancy,
        percentage,
        status,
        bookings: dayBookings,
      };
    });
  };

  // Helper function to check if a booking end date has time information
  // If it has time data (not midnight/00:00), consider the dog still present on the end date
  const hasBookingTimeData = (dateString: string): boolean => {
    if (!dateString) return false;

    // Check if the time portion is not all zeros (00:00:00)
    const timePart = dateString.substring(11, 19);
    return timePart !== "00:00:00" && timePart !== "";
  };

  const getTotalDogsForDay = (
    dayStatus: DayRoomStatus[],
    date: Date,
  ): number => {
    // For each day, we need to exclude dogs that are leaving that day from the count
    let totalDogs = 0;
    const dateString = format(date, "yyyy-MM-dd");

    dayStatus.forEach((status) => {
      // Count only dogs that aren't leaving on this day
      const dogsNotLeaving = status.bookings.filter((booking) => {
        const endDateStr = booking.endDate
          ? booking.endDate.substring(0, 10)
          : "";
        return endDateStr !== dateString;
      });

      totalDogs += dogsNotLeaving.length;
    });

    return totalDogs;
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  // Get days from previous month to fill in the first week
  const firstDay = startOfMonth(currentDate);
  const firstDayOfWeek = firstDay.getDay();

  // In Israel/Hebrew calendar, Sunday is the first day (0)
  // We need to add empty cells before the first day of the month
  const emptyDaysAtStart = firstDayOfWeek;

  const statusColors = {
    green: "bg-green-100",
    yellow: "bg-yellow-100",
    red: "bg-red-100",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        {t("loading", "Loading...")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t("occupancyCalendar", "Occupancy Calendar")}
        </h1>
        <MonthNavigator currentDate={currentDate} onNavigate={setCurrentDate} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {(i18n.language.startsWith("en")
            ? [
                t("sunday", "Sunday"),
                t("monday", "Monday"),
                t("tuesday", "Tuesday"),
                t("wednesday", "Wednesday"),
                t("thursday", "Thursday"),
                t("friday", "Friday"),
                t("saturday", "Saturday"),
              ]
            : [
                t("sunday", "ראשון"),
                t("monday", "שני"),
                t("tuesday", "שלישי"),
                t("wednesday", "רביעי"),
                t("thursday", "חמישי"),
                t("friday", "שישי"),
                t("saturday", "שבת"),
              ]
          ).map((day) => (
            <div
              key={day}
              className="bg-gray-50 p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-700"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {/* Add empty cells for days before the first day of month */}
          {Array.from({ length: emptyDaysAtStart }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-white p-2 sm:p-4 min-h-[130px] sm:min-h-[160px]"
            />
          ))}

          {days.map((day) => {
            const dayStatus = getDayStatus(day);
            const hasBookings = dayStatus.some(
              (status) => status.occupancy > 0,
            );
            const totalDogs = getTotalDogsForDay(dayStatus, day);

            return (
              <div
                key={day.toISOString()}
                className={`bg-white p-2 sm:p-4 min-h-[130px] sm:min-h-[160px] cursor-pointer hover:bg-gray-50 transition-colors ${
                  isToday(day) ? "bg-blue-50 hover:bg-blue-100" : ""
                }`}
                onClick={() => setSelectedDate(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  {isToday(day) ? (
                    <span className="font-medium text-base sm:text-lg inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white">
                      {format(day, "d", { locale })}
                    </span>
                  ) : (
                    <span
                      className={`font-medium text-base sm:text-lg ${
                        hasBookings ? "text-blue-600" : "text-gray-900"
                      }`}
                    >
                      {format(day, "d", { locale })}
                    </span>
                  )}
                  {totalDogs > 0 && (
                    <span className="text-xs font-medium px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                      {totalDogs} 🐕
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-0.5">
                  {Array.isArray(rooms) &&
                    rooms.map((room) => {
                      const status = dayStatus.find(
                        (s) => s.room.id === room.id,
                      );
                      if (!status) return null;

                      const displayName =
                        room.displayName === "חדר קטנים"
                          ? "קטנים"
                          : room.displayName === "חדר גדולים"
                            ? "גדולים"
                            : room.displayName === "בית"
                              ? "בית"
                              : room.displayName;

                      return (
                        <div
                          key={room.id}
                          className={`h-5 flex items-center px-1.5 ${statusColors[status.status]}`}
                        >
                          <span className="text-xs font-medium">
                            {displayName}
                          </span>
                          <span className="text-xs ml-auto">
                            {status.occupancy > 0
                              ? `${status.occupancy}/${room.maxCapacity}`
                              : ""}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-end text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-100 rounded"></span>
          <span className="text-gray-600">{t("available")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-yellow-100 rounded"></span>
          <span className="text-gray-600">{t("partiallyOccupied")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-100 rounded"></span>
          <span className="text-gray-600">{t("fullyOccupied")}</span>
        </div>
      </div>

      {selectedDate && (
        <DayDetailsModal
          isOpen={true}
          onClose={() => setSelectedDate(null)}
          date={selectedDate}
          roomStatuses={getDayStatus(selectedDate, true)}
        />
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <ClientLayout>
      <CalendarContent />
    </ClientLayout>
  );
}
