"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MonthlyFinancialReport } from "./components/MonthlyFinancialReport";
import { UnpaidBookings } from "./components/UnpaidBookings";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/utils";
import { formatDateLocale } from "@/lib/utils";
import { fetchWithTenant } from "@/lib/client-tenant";
import ClientLayout from "./components/ClientLayout";
import { useMemo } from "react";

interface MonthlyData {
  month: string;
  total: number;
}

interface Owner {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
}

interface Dog {
  id: number;
  name: string;
  breed: string;
  specialNeeds: string | null;
  owner: Owner;
}

interface Payment {
  id: number;
  amount: number;
  method: string;
  createdAt: string;
}

interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  priceType: "DAILY" | "FIXED";
  pricePerDay: number | null;
  totalPrice: number | null;
  dog: Dog;
  payments: Payment[];
}

function Home() {
  const { t, i18n } = useTranslation();
  const [activeClients, setActiveClients] = useState(0);
  const [actualIncome, setActualIncome] = useState(0);
  const [dogsInPension, setDogsInPension] = useState(0);
  const [todayBookings, setTodayBookings] = useState(0);
  const [yesterdayDogsInPension, setYesterdayDogsInPension] = useState(0);
  const [yesterdayArrivals, setYesterdayArrivals] = useState(0);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [upcomingDogs, setUpcomingDogs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kennelName, setKennelName] = useState<string>("");
  const [userName, setUserName] = useState<string>("User");
  
  const router = useRouter();
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    // Initialize page data: fetch tenant name first to avoid header flashing
    const initializePage = async () => {
      try {
        await fetchTenantName();
      } catch {}
      await fetchData();
    };

    initializePage();
  }, []);

  // Listen for kennel settings updates
  useEffect(() => {
    const handleKennelSettingsUpdate = () => {
      fetchTenantName();
    };

    window.addEventListener(
      "kennelSettingsUpdated",
      handleKennelSettingsUpdate,
    );

    return () => {
      window.removeEventListener(
        "kennelSettingsUpdated",
        handleKennelSettingsUpdate,
      );
    };
  }, []);

  const fetchTenantName = async () => {
    try {
      // Use the tenant context from the API instead of localStorage
      const response = await fetch("/api/tenants/current", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const tenantData = await response.json();
        setKennelName((prev) => tenantData.name || prev || "");
        
      } else {
        console.error("Error fetching tenant name:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching tenant name:", error);
    }
  };

  // Demo/restore tools moved to Settings page

  // Function to fetch dashboard data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch bookings
      let bookings: Booking[] = [];

      try {
        console.log("[HOME] About to fetch bookings...");

        const bookingsResponse = await fetchWithTenant<
          | { upcoming: Booking[]; past: Booking[]; all: Booking[] }
          | { error: string }
        >("/api/bookings");

        console.log(
          "[HOME] Bookings fetch completed, response:",
          bookingsResponse,
        );
        console.log("[HOME] Response type:", typeof bookingsResponse);
        console.log(
          "[HOME] Response keys:",
          bookingsResponse ? Object.keys(bookingsResponse) : "null",
        );

        if (
          bookingsResponse &&
          typeof bookingsResponse === "object" &&
          "error" in bookingsResponse
        ) {
          throw new Error(bookingsResponse.error);
        }

        // Handle the API response structure { upcoming, past, all }
        bookings = (
          bookingsResponse && "all" in bookingsResponse
            ? bookingsResponse.all
            : []
        ) as Booking[];
        console.log("[HOME] Final bookings array length:", bookings.length);

        if (bookings.length > 0) {
          console.log("[HOME] Sample booking:", bookings[0]);
        }
      } catch (fetchError) {
        console.error("[HOME] Error fetching bookings:", fetchError);
        throw fetchError;
      }

      // Calculate dashboard metrics
      const activeOwnersSet = new Set(
        bookings
          .map((booking: Booking) => booking.dog?.owner?.id)
          .filter(Boolean),
      );
      setActiveClients(activeOwnersSet.size);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const dogsInPensionCount = bookings.filter((booking: Booking) => {
        if (!booking.startDate || !booking.endDate || !booking.dog)
          return false;
        const startDate = new Date(booking.startDate);
        const endDate = new Date(booking.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        return (
          startDate.getTime() <= today.getTime() &&
          endDate.getTime() > today.getTime()
        );
      }).length;
      setDogsInPension(dogsInPensionCount);

      // Yesterday dogs in pension
      const yDogs = bookings.filter((booking: Booking) => {
        if (!booking.startDate || !booking.endDate || !booking.dog) return false;
        const startDate = new Date(booking.startDate);
        const endDate = new Date(booking.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        return (
          startDate.getTime() <= yesterday.getTime() &&
          endDate.getTime() > yesterday.getTime()
        );
      }).length;
      setYesterdayDogsInPension(yDogs);

      const todayBookingsCount = bookings.filter((booking: Booking) => {
        if (!booking.startDate || !booking.dog) return false;
        const startDate = new Date(booking.startDate);
        startDate.setHours(0, 0, 0, 0);
        return startDate.getTime() === today.getTime();
      }).length;
      setTodayBookings(todayBookingsCount);

      // Yesterday arrivals
      const yesterdayArrivalsCount = bookings.filter((booking: Booking) => {
        if (!booking.startDate || !booking.dog) return false;
        const startDate = new Date(booking.startDate);
        startDate.setHours(0, 0, 0, 0);
        return startDate.getTime() === yesterday.getTime();
      }).length;
      setYesterdayArrivals(yesterdayArrivalsCount);

      // Get upcoming dogs
      const todayString = format(today, "yyyy-MM-dd");
      const upcomingBookings = bookings.filter((booking: Booking) => {
        if (!booking.startDate || !booking.dog) return false;
        return booking.startDate >= todayString;
      });
      const sortedUpcoming = upcomingBookings.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
      setUpcomingDogs(sortedUpcoming.slice(0, 5));

      // Calculate monthly income - bookings that occur in current month (any year)
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0);

      const monthlyBookings = bookings.filter((booking: Booking) => {
        if (!booking.startDate || !booking.endDate) return false;
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        // Overlaps current month
        return bookingStart <= monthEnd && bookingEnd >= monthStart;
      });

      const monthlyTotal = monthlyBookings.reduce((total, booking) => {
        // Calculate the portion of the booking that falls in current month
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        
        const overlapStart = new Date(Math.max(bookingStart.getTime(), monthStart.getTime()));
        const overlapEnd = new Date(Math.min(bookingEnd.getTime(), monthEnd.getTime()));
        
        const daysInMonth = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        if (booking.totalPrice) {
          const totalDays = Math.ceil((bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return total + (booking.totalPrice / totalDays) * daysInMonth;
        } else if (booking.pricePerDay) {
          return total + (booking.pricePerDay * daysInMonth);
        }
        return total;
      }, 0);
      
      setActualIncome(monthlyTotal);

      // Sort bookings by date for recent bookings
      const sortedBookings = bookings.sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      );
      setRecentBookings(sortedBookings.slice(0, 5));

      // Filter pending and group multi-dog reservations by owner+dates
      const pendingRaw = bookings.filter((b: Booking) => b.status === "PENDING");
      const groupMap = new Map<string, Booking & { dogs: string[] }>();
      for (const b of pendingRaw) {
        const ownerId = (b as any)?.dog?.owner?.id ?? (b as any)?.dog?.owner?.phone ?? (b as any)?.dog?.owner?.name;
        const key = `${ownerId}::${b.startDate}::${b.endDate}`;
        const existing = groupMap.get(key);
        if (!existing) {
          (b as any).dogs = [(b as any).dog?.name];
          groupMap.set(key, b as any);
        } else {
          (existing as any).dogs.push((b as any).dog?.name);
        }
      }
      const pendingGrouped = Array.from(groupMap.values());
      setPendingBookings(pendingGrouped.slice(0, 5));

      // Fetch kennel settings (name) and user profile for greeting
      try {
        const [settings, profile] = await Promise.all([
          fetchWithTenant<Record<string, string>>("/api/settings"),
          fetchWithTenant<{ firstName?: string; name?: string }>(
            "/api/profile",
          ),
        ]);

        if (profile) {
          const friendly = profile.firstName || profile.name || "User";
          setUserName(friendly);
        }
      } catch (infoErr) {
        console.warn("[HOME] Could not fetch settings/profile:", infoErr);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load dashboard",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    formatDateLocale(dateString, i18n.language);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <span className="text-green-600">{t("statusConfirmed")}</span>;
      case "PENDING":
        return <span className="text-yellow-600">{t("statusPending")}</span>;
      case "CANCELLED":
        return <span className="text-red-600">{t("statusCancelled")}</span>;
      default:
        return status;
    }
  };

  const kpiBase = "p-6 rounded-xl shadow-sm min-h-[122px] flex flex-col justify-between";
  const iconWrap = "w-10 h-10 flex items-center justify-center rounded-full";
  const kpiTitle = "text-sm font-medium text-gray-500 leading-tight min-h-[40px]";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {t("loadingDashboard", "Loading dashboard...")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t("tryAgain", "Try Again")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Colorful slim header */}
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-lg"></div>
        <div className="relative px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-xl">🏠</span>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                {kennelName || t("dashboardOverview", "Dashboard Overview")}
              </h1>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-2 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  {t("systemOnline", "System Online")}
                </span>
                <span className="flex items-center gap-2 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  {t("readyForBookings", "Ready for Bookings")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-white/70 backdrop-blur border border-gray-200 rounded-full text-gray-700">
              <span>👋</span> {userName}
            </span>
            <Link
              href="/bookings/new"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <span className="font-medium">{t("newBooking")}</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className={`bg-blue-50/50 border border-blue-100 ${kpiBase}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={kpiTitle}>
                {t("dogsInPension", "Dogs in Kennel")}
              </p>
              <p className="text-2xl font-bold mt-2">{dogsInPension}</p>
              <p className={`mt-1 text-xs ${dogsInPension - yesterdayDogsInPension > 0 ? 'text-green-600' : dogsInPension - yesterdayDogsInPension < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {(dogsInPension - yesterdayDogsInPension > 0 ? '▲' : dogsInPension - yesterdayDogsInPension < 0 ? '▼' : '—')} {Math.abs(dogsInPension - yesterdayDogsInPension)} {t('vsYesterday','vs yesterday')}
              </p>
            </div>
            <div className={`${iconWrap} bg-blue-100`}>
              <span className="text-blue-600 text-xl">🐕</span>
            </div>
          </div>
        </div>

        <div className={`bg-purple-50/50 border border-purple-100 ${kpiBase}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={kpiTitle}>
                {t("activeClients", "Active Clients")}
              </p>
              <p className="text-2xl font-bold mt-2">{activeClients}</p>
            </div>
            <div className={`${iconWrap} bg-purple-100`}>
              <span className="text-purple-600 text-xl">👥</span>
            </div>
          </div>
        </div>

        <div className={`bg-green-50/50 border border-green-100 ${kpiBase}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={kpiTitle}>
                {t("todayBookings", "Today's Arrivals")}
              </p>
              <p className="text-2xl font-bold mt-2">{todayBookings}</p>
              <p className={`mt-1 text-xs ${todayBookings - yesterdayArrivals > 0 ? 'text-green-600' : todayBookings - yesterdayArrivals < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {(todayBookings - yesterdayArrivals > 0 ? '▲' : todayBookings - yesterdayArrivals < 0 ? '▼' : '—')} {Math.abs(todayBookings - yesterdayArrivals)} {t('vsYesterday','vs yesterday')}
              </p>
            </div>
            <div className={`${iconWrap} bg-green-100`}>
              <span className="text-green-600 text-xl">📅</span>
            </div>
          </div>
        </div>

        <div className={`bg-yellow-50/50 border border-yellow-100 ${kpiBase}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={kpiTitle}>
                {t("pendingBookings", "Pending Bookings")}
              </p>
              <p className="text-2xl font-bold mt-2">{pendingBookings.length}</p>
            </div>
            <div className={`${iconWrap} bg-yellow-100`}>
              <span className="text-yellow-600 text-xl">📝</span>
            </div>
          </div>
        </div>

        <div className={`bg-indigo-50/50 border border-indigo-100 ${kpiBase}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={kpiTitle}>
                {t("dogsArrivingToday", "Dogs Arriving Today")}
              </p>
              <p className="text-2xl font-bold mt-2">{todayBookings}</p>
            </div>
            <div className={`${iconWrap} bg-indigo-100`}>
              <span className="text-indigo-600 text-xl">⏭️</span>
            </div>
          </div>
        </div>

        <div className={`bg-amber-50/50 border border-amber-100 ${kpiBase}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={kpiTitle}>
                {t("monthlyIncome", "Monthly Income")}
              </p>
              <p className="text-2xl font-bold mt-2">
                {formatCurrency(actualIncome, i18n.language)}
              </p>
            </div>
            <div className={`${iconWrap} bg-yellow-100`}>
              <span className="text-yellow-600 text-xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">{t("pendingBookings", "Pending Bookings")}</h2>
            <Link href="/bookings" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
              {t("review", "Review")} <ArrowUpRight className="h-4 w-4 mr-1" />
            </Link>
          </div>
          {pendingBookings.length === 0 ? (
            <p className="text-gray-500">{t("noPendingBookings", "No pending bookings")}</p>
          ) : (
            <div className="space-y-3">
              {pendingBookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                  <div>
                    <div className="font-medium">{(b.dogs && b.dogs.length > 1) ? `${b.dogs[0]} +${b.dogs.length-1}` : b.dog?.name} · {b.dog?.owner?.name || 'Owner'}</div>
                    <div className="text-xs text-gray-500">{formatDate(b.startDate)} → {formatDate(b.endDate)}</div>
                  </div>
                  <Link href={`/bookings/${b.id}`} className="text-blue-600 text-sm">{t("open", "Open")}</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow-sm rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {t("unpaidPayments", "Unpaid Bookings")}
            </h2>
            <Link
              href="/payments"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              {t("viewAllPayments", "View All Payments")} {" "}
              <ArrowUpRight className="h-4 w-4 mr-1" />
            </Link>
          </div>
          <UnpaidBookings limit={4} />
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">
                {t("upcomingDogs", "Upcoming Dogs")}
              </h2>
              <Link
                href="/calendar"
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                {t("viewCalendar", "View Calendar")}
              </Link>
            </div>

            {upcomingDogs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                {t("noUpcomingDogs", "No upcoming dogs")}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingDogs.map((booking) => (
                  <div
                    key={booking.id}
                    className={`border border-gray-200 rounded-xl p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      booking.startDate.substring(0, 10) ===
                      format(new Date(), "yyyy-MM-dd")
                        ? "bg-green-50 border-green-200"
                        : ""
                    }`}
                    onClick={() => router.push(`/bookings/${booking.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <span className="text-3xl">🐕</span>
                      </div>
                      <div>
                        <div className="font-semibold">
                          {booking.dog?.name || t("dogName", "Dog")}
                        </div>
                        <div className="text-gray-500 text-sm">
                          {booking.dog?.owner?.name || t("owner", "Owner")}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {t("checkIn", "Check-in:")}{" "}
                          {formatDate(booking.startDate)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {t("checkOut", "Check-out:")}{" "}
                          {formatDate(booking.endDate)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {t("status", "Status:")}{" "}
                          {getStatusDisplay(booking.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">
                {t("recentBookings", "Recent Bookings")}
              </h2>
              <Link
                href="/bookings"
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                {t("viewAllBookings", "View All Bookings")}
              </Link>
            </div>
            {recentBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                {t("noRecentBookings", "No recent bookings")}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <span className="text-3xl">🐕</span>
                      </div>
                      <div>
                        <div className="font-semibold">
                          {booking.dog?.name || t("dogName", "Dog")}
                        </div>
                        <div className="text-gray-500 text-sm">
                          {booking.dog?.owner?.name || t("owner", "Owner")}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {t("checkIn", "Check-in:")}{" "}
                          {formatDate(booking.startDate)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {t("checkOut", "Check-out:")}{" "}
                          {formatDate(booking.endDate)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {t("status", "Status:")}{" "}
                          {getStatusDisplay(booking.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <MonthlyFinancialReport />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <ClientLayout>
      <Home />
    </ClientLayout>
  );
}
