"use client";

import {
  Home,
  Calendar,
  Users,
  Dog,
  Settings,
  DollarSign,
  CreditCard,
  Menu,
  X,
  Building,
  UserPlus,
  User,
  Globe,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSupabase } from "@/contexts/SupabaseBrowserContext";
import LogoutButton from "@/components/LogoutButton";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import type { Session } from "@supabase/supabase-js";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import GlobalAdminSidebar from "@/components/GlobalAdminSidebar";
import { useTranslation } from "react-i18next";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useSupabase();

  // Initialize client-side flag first
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Simple authentication check
  useEffect(() => {
    if (!isClient) return;

    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isClient, supabase]);

  // Don't render anything until client-side hydration is complete
  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sidebar if user is authenticated
  const showSidebar = !!session;

  return (
    <div className="flex h-screen bg-white">
      {/* Render Sidebar */}
      {showSidebar && (
        <>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>

          {/* Sidebar */}
          <div
            className={`
            fixed lg:static w-64 bg-white border-r border-gray-200 p-4
            transition-transform duration-300 ease-in-out z-40
            ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            h-full flex flex-col
          `}
          >
            {/* Logo */}
            <div className="flex flex-col items-start mb-4 px-3">
              <Link href="/">
                <Image
                  src="/images/logo.svg"
                  alt="Zanav.io"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>
            </div>

            {/* Scrollable Navigation Area */}
            <div className="flex-1 overflow-y-auto">
              {/* Main Navigation */}
              <div className="space-y-1">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="bg-blue-100 p-1.5 rounded-md group-hover:bg-blue-200 transition-colors">
                    <Home className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-sm">
                    {t("homeLink", "Home")}
                  </span>
                </Link>
                <Link
                  href="/bookings"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-green-50 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="bg-green-100 p-1.5 rounded-md group-hover:bg-green-200 transition-colors">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-medium text-sm">
                    {t("bookingsLink", "Bookings")}
                  </span>
                </Link>
                <Link
                  href="/calendar"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-orange-50 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="bg-orange-100 p-1.5 rounded-md group-hover:bg-orange-200 transition-colors">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="font-medium text-sm">
                    {t("occupancyLink", "Occupancy")}
                  </span>
                </Link>
                <Link
                  href="/clients"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-purple-50 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="bg-purple-100 p-1.5 rounded-md group-hover:bg-purple-200 transition-colors">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="font-medium text-sm">
                    {t("clientsLink", "Clients")}
                  </span>
                </Link>
                <Link
                  href="/payments"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-green-50 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="bg-green-100 p-1.5 rounded-md group-hover:bg-green-200 transition-colors">
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-medium text-sm">
                    {t("paymentsLink", "Payments")}
                  </span>
                </Link>
                <Link
                  href="/financial-report"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-yellow-50 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="bg-yellow-100 p-1.5 rounded-md group-hover:bg-yellow-200 transition-colors">
                    <DollarSign className="h-4 w-4 text-yellow-600" />
                  </div>
                  <span className="font-medium text-sm">
                    {t("financialReportLink", "Financial Report")}
                  </span>
                </Link>
              </div>

              {/* Settings Section */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="bg-gray-100 p-1.5 rounded-md group-hover:bg-gray-200 transition-colors">
                    <Settings className="h-4 w-4 text-gray-600" />
                  </div>
                  <span className="font-medium text-sm">
                    {t("settingsLink", "Settings")}
                  </span>
                </Link>
                <Link
                  href="/settings/website"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="bg-blue-100 p-1.5 rounded-md group-hover:bg-blue-200 transition-colors">
                    <Globe className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-sm">Website</span>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="bg-blue-100 p-1.5 rounded-md group-hover:bg-blue-200 transition-colors">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-sm">
                    {t("profileLink", "My Profile")}
                  </span>
                </Link>
                <Link
                  href="/users"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-purple-50 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="bg-purple-100 p-1.5 rounded-md group-hover:bg-purple-200 transition-colors">
                    <UserPlus className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="font-medium text-sm">
                    {t("manageUsersLink", "Manage Users")}
                  </span>
                </Link>
              </div>
            </div>

            {/* Sticky Footer Section */}
            <div className="mt-4 space-y-3 pt-4 border-t border-gray-200 bg-white">
              <LanguageSwitcher />
              <DeleteAccountButton />
              <LogoutButton />
              {/* Temporary debug buttons */}
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/debug/user-status');
                    const data = await response.json();
                    console.log('User Status:', data);
                    alert(JSON.stringify(data, null, 2));
                  } catch (error) {
                    console.error('Debug error:', error);
                    alert('Debug failed: ' + error);
                  }
                }}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
              >
                <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <span className="text-blue-600 font-bold">?</span>
                </div>
                <span className="font-medium text-blue-700">Debug Status</span>
              </button>
              <button
                onClick={async () => {
                  if (confirm('⚠️ FORCE DELETE: This will completely remove your account and all data. Are you absolutely sure?')) {
                    try {
                      const response = await fetch('/api/debug/force-delete-user', { method: 'POST' });
                      const data = await response.json();
                      console.log('Force Delete Result:', data);
                      if (data.success) {
                        alert('Account deleted! Redirecting to landing page...');
                        window.location.href = '/landing';
                      } else {
                        alert('Force delete failed: ' + (data.error || data.message));
                      }
                    } catch (error) {
                      console.error('Force delete error:', error);
                      alert('Force delete failed: ' + error);
                    }
                  }
                }}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 rounded-xl transition-all duration-200 group"
              >
                <div className="bg-red-100 p-2 rounded-lg group-hover:bg-red-200 transition-colors">
                  <span className="text-red-600 font-bold">⚠️</span>
                </div>
                <span className="font-medium text-red-700">FORCE DELETE</span>
              </button>
              <button
                onClick={async () => {
                  try {
                    // Clear all cookies manually
                    document.cookie.split(";").forEach(function(c) { 
                      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                    });
                    // Clear localStorage
                    localStorage.clear();
                    // Clear sessionStorage
                    sessionStorage.clear();
                    alert('Session cleared! Refreshing page...');
                    window.location.reload();
                  } catch (error) {
                    console.error('Clear session error:', error);
                    alert('Failed to clear session: ' + error);
                  }
                }}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-yellow-50 rounded-xl transition-all duration-200 group"
              >
                <div className="bg-yellow-100 p-2 rounded-lg group-hover:bg-yellow-200 transition-colors">
                  <span className="text-yellow-600 font-bold">🧹</span>
                </div>
                <span className="font-medium text-yellow-700">Clear Session</span>
              </button>
            </div>
          </div>

          {/* Overlay for mobile menu */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </>
      )}

      {/* Main content area */}
      <main className="flex-1 bg-white overflow-y-auto">
        <div className="p-8 pt-20 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
