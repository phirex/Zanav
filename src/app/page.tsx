"use client";

import {
  Calendar,
  Users,
  Dog,
  DollarSign,
  ArrowUpRight,
  Search,
  Plus,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MonthlyFinancialReport } from "./components/MonthlyFinancialReport";
import { UnpaidBookings } from "./components/UnpaidBookings";
import { format } from "date-fns";
import { createBrowserClient } from "@supabase/ssr";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/utils";
import { formatDateLocale } from "@/lib/utils";
import { fetchWithTenant } from "@/lib/client-tenant";
import ClientLayout from "./components/ClientLayout";

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
  const [projectedIncome, setProjectedIncome] = useState(0);
  const [actualIncome, setActualIncome] = useState(0);
  const [dogsInPension, setDogsInPension] = useState(0);
  const [todayBookings, setTodayBookings] = useState(0);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [upcomingDogs, setUpcomingDogs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kennelName, setKennelName] = useState<string>("");
  const [userName, setUserName] = useState<string>("User");
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [headerLoaded, setHeaderLoaded] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Fetch data on component mount
  useEffect(() => {
    // Initialize page data
    const initializePage = async () => {
      try {
        console.log('✅ Initializing dashboard page');
        await fetchData();
        await fetchTenantName();
      } catch (error) {
        console.error('Error initializing page:', error);
        // Fallback: try to fetch data anyway
        await fetchData();
        await fetchTenantName();
      }
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
        setKennelName(tenantData.name || "");
        setHeaderLoaded(true);
      } else {
        console.error("Error fetching tenant name:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching tenant name:", error);
    }
  };

  // Function to generate demo data
  const generateDemoData = async () => {
    if (generatingDemo) return;

    setGeneratingDemo(true);
    try {
      const response = await fetchWithTenant<{
        success: boolean;
        message: string;
        summary: {
          bookings: number;
          owners: number;
          rooms: number;
          dogs: number;
          payments: number;
          templates: number;
        };
        error?: string;
      }>("/api/generate-demo-data", {
        method: "POST",
      });

      if (response.success) {
        console.log(
          "[HOME] Demo data generated successfully:",
          response.summary,
        );
        alert(
          `Demo data generated successfully! Created ${response.summary.bookings} bookings, ${response.summary.owners} clients, and more.`,
        );
        window.location.reload();
      } else {
        throw new Error(response.error || "Failed to generate demo data");
      }
    } catch (error: any) {
      console.error("[HOME] Error generating demo data:", error);
      alert(`Error generating demo data: ${error.message}`);
    } finally {
      setGeneratingDemo(false);
    }
  };

  // Function to regenerate demo data (clears existing data first)
  const regenerateDemoData = async () => {
    if (generatingDemo) return;

    if (!confirm("This will clear all existing data and create new demo data. Are you sure?")) {
      return;
    }

    setGeneratingDemo(true);
    try {
      const response = await fetchWithTenant<{
        success: boolean;
        message: string;
        summary: {
          bookings: number;
          owners: number;
          rooms: number;
          dogs: number;
          payments: number;
          templates: number;
        };
        error?: string;
      }>("/api/regenerate-demo-data", {
        method: "POST",
      });

      if (response.success) {
        console.log(
          "[HOME] Demo data regenerated successfully:",
          response.summary,
        );
        alert(
          `Demo data regenerated successfully! Created ${response.summary.bookings} bookings, ${response.summary.owners} clients, and more.`,
        );
        window.location.reload();
      } else {
        throw new Error(response.error || "Failed to regenerate demo data");
      }
    } catch (error: any) {
      console.error("[HOME] Error regenerating demo data:", error);
      alert(`Error regenerating demo data: ${error.message}`);
    } finally {
      setGeneratingDemo(false);
    }
  };

  const restoreWebsiteContent = async () => {
    if (generatingDemo) return;

    setGeneratingDemo(true);
    try {
      const response = await fetchWithTenant<{
        success: boolean;
        message: string;
        summary: {
          testimonials: number;
          faqs: number;
          gallery: number;
        };
        error?: string;
      }>("/api/restore-website-content", {
        method: "POST",
      });

      if (response.success) {
        console.log(
          "[HOME] Website content restored successfully:",
          response.summary,
        );
        alert(
          `Website content restored successfully! Created ${response.summary.testimonials} testimonials, ${response.summary.faqs} FAQ items, and ${response.summary.gallery} gallery images.`,
        );
      } else {
        throw new Error(response.error || "Failed to restore website content");
      }
    } catch (error: any) {
      console.error("[HOME] Error restoring website content:", error);
      alert(`Error restoring website content: ${error.message}`);
    } finally {
      setGeneratingDemo(false);
    }
  };

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

      const todayBookingsCount = bookings.filter((booking: Booking) => {
        if (!booking.startDate || !booking.dog) return false;
        const startDate = new Date(booking.startDate);
        startDate.setHours(0, 0, 0, 0);
        return startDate.getTime() === today.getTime();
      }).length;
      setTodayBookings(todayBookingsCount);

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
      // For demo data, look at July 2025 (where we have data)
      const currentMonth = today.getMonth();
      const demoYear = 2025; // Use 2025 for demo data
      const monthStart = new Date(demoYear, currentMonth, 1);
      const monthEnd = new Date(demoYear, currentMonth + 1, 0);

      const monthlyBookings = bookings.filter((booking: Booking) => {
        if (!booking.startDate || !booking.endDate) return false;
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        
        // Check if booking overlaps with current month in demo year
        return (
          (bookingStart.getMonth() === currentMonth && bookingStart.getFullYear() === demoYear) ||
          (bookingEnd.getMonth() === currentMonth && bookingEnd.getFullYear() === demoYear) ||
          (bookingStart <= monthStart && bookingEnd >= monthEnd)
        );
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
      
      console.log("[DASHBOARD] Monthly calculation:", {
        currentMonth,
        demoYear,
        monthlyBookings: monthlyBookings.length,
        monthlyTotal,
        bookingsSample: monthlyBookings.slice(0, 2).map(b => ({
          id: b.id,
          startDate: b.startDate,
          endDate: b.endDate,
          totalPrice: b.totalPrice
        }))
      });
      setActualIncome(monthlyTotal);

      // Sort bookings by date for recent bookings
      const sortedBookings = bookings.sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      );
      setRecentBookings(sortedBookings.slice(0, 5));

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
      {/* Fancy Kennel Name Header */}
      <div
        className={`relative mb-8 transition-all duration-1000 ${headerLoaded ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-4"}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"></div>
        <div className="relative py-8 pl-8 pr-4">
          {kennelName ? (
            <div className="w-full flex flex-col items-start">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-2xl">🏠</span>
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {kennelName}
                  </h1>
                  <p className="text-xl text-gray-600 font-medium">
                    {t("dashboardOverview", "Dashboard Overview")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">System Online</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">Ready for Bookings</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-start">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                  <span className="text-white text-2xl">🏠</span>
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent mb-2">
                    {t("dashboardOverview", "Dashboard Overview")}
                  </h1>
                  <p className="text-xl text-gray-500 font-medium">
                    {t("loadingKennelName", "Loading kennel information...")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <span className="text-lg">👋</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-700">
                {t("dashboardGreeting", { name: userName })}
              </h2>
              <p className="text-sm text-gray-500">
                Welcome back to your dashboard
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={generateDemoData}
              disabled={generatingDemo}
              className="text-sm px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 disabled:from-gray-50 disabled:to-gray-100 disabled:cursor-not-allowed rounded-lg text-blue-700 disabled:text-gray-500 border border-blue-200 hover:border-blue-300 transition-all duration-200"
              title="Generate demo data"
            >
              {generatingDemo ? "⏳ Generating..." : "🎭 Demo Data"}
            </button>
            <button
              onClick={regenerateDemoData}
              disabled={generatingDemo}
              className="text-sm px-3 py-2 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 disabled:from-gray-50 disabled:to-gray-100 disabled:cursor-not-allowed rounded-lg text-orange-700 disabled:text-gray-500 border border-orange-200 hover:border-orange-300 transition-all duration-200"
              title="Regenerate demo data (clears existing data)"
            >
              {generatingDemo ? "⏳ Regenerating..." : "🔄 Regenerate"}
            </button>
            <button
              onClick={restoreWebsiteContent}
              disabled={generatingDemo}
              className="text-sm px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 disabled:from-gray-50 disabled:to-gray-100 disabled:cursor-not-allowed rounded-lg text-green-700 disabled:text-gray-500 border border-green-200 hover:border-green-300 transition-all duration-200"
              title="Restore website content (testimonials, FAQ, gallery)"
            >
              {generatingDemo ? "⏳ Restoring..." : "🌐 Restore Website"}
            </button>
          </div>
        </div>
        <Link
          href="/bookings/new"
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <span className="font-medium">{t("newBooking")}</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                {t("dogsInPension", "Dogs in Kennel")}
              </p>
              <p className="text-2xl font-bold mt-2">{dogsInPension}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <span className="text-blue-600 text-xl">🐕</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                {t("activeClients", "Active Clients")}
              </p>
              <p className="text-2xl font-bold mt-2">{activeClients}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <span className="text-purple-600 text-xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                {t("todayBookings", "Today's Arrivals")}
              </p>
              <p className="text-2xl font-bold mt-2">{todayBookings}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <span className="text-green-600 text-xl">📅</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                {t("monthlyIncome", "Monthly Income")}
              </p>
              <p className="text-2xl font-bold mt-2">
                {formatCurrency(projectedIncome, i18n.language)}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <span className="text-yellow-600 text-xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {t("unpaidPayments", "Unpaid Payments")}
          </h2>
          <Link
            href="/payments"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            {t("viewAllPayments", "View All Payments")}{" "}
            <ArrowUpRight className="h-4 w-4 mr-1" />
          </Link>
        </div>
        <UnpaidBookings />
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
