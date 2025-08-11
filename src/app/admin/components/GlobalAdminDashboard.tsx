import React, { useState } from "react";
import Link from "next/link";
import { Users, Building, BarChart, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";

// Placeholder data - replace with actual data fetching
const stats = {
  totalTenants: 15,
  totalUsers: 120,
  totalBookings: 5432,
  activeNotifications: 50,
};

export default function GlobalAdminDashboard() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [message, setMessage] = useState("");

  const handlePromoteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setPromoting(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/promote-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✅ ${result.message}`);
        setEmail("");
        setName("");
      } else {
        setMessage(`❌ ${result.error}`);
      }
    } catch (error) {
      setMessage("❌ Failed to promote user. Please try again.");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">
        {t("globalAdminDashboardTitle", "Global Admin Dashboard")}
      </h1>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title={t("totalTenants", "Total Tenants")}
          value={stats.totalTenants}
          icon={<Building className="h-6 w-6 text-blue-500" />}
        />
        <StatCard
          title={t("totalUsers", "Total Users")}
          value={stats.totalUsers}
          icon={<Users className="h-6 w-6 text-green-500" />}
        />
        <StatCard
          title={t("totalBookingsAllTime", "Total Bookings (All Time)")}
          value={stats.totalBookings}
          icon={<BarChart className="h-6 w-6 text-purple-500" />}
        />
        <StatCard
          title={t("activeNotifications", "Active Notifications")}
          value={stats.activeNotifications}
          icon={<Users className="h-6 w-6 text-red-500" />}
        />
      </div>

      {/* Promote User Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="h-6 w-6 text-yellow-500" />
          <h2 className="text-xl font-semibold text-gray-900">Promote User to Global Admin</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Use this form to promote a user to global admin status. This will give them access to all system-wide functions.
        </p>
        
        <form onSubmit={handlePromoteUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                User Email *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name (Optional)
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="User's name"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={promoting || !email.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {promoting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Promoting...
              </>
            ) : (
              <>
                <Crown className="h-4 w-4" />
                Promote to Global Admin
              </>
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            message.startsWith("✅") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Management Links Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ManagementLink
          href="/admin/tenants"
          title={t("manageTenants", "Manage Tenants")}
          description={t(
            "manageTenantsDesc",
            "View, create, edit, and delete tenants.",
          )}
          icon={<Building className="h-8 w-8 text-blue-600" />}
        />
        <ManagementLink
          href="/admin/users"
          title={t("manageGlobalUsers", "Manage Global Users")}
          description={t(
            "manageGlobalUsersDesc",
            "View and manage global administrators.",
          )}
          icon={<Users className="h-8 w-8 text-green-600" />}
        />
      </div>
    </div>
  );
}

// Helper component for stat cards
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
      <div className="p-3 rounded-full bg-gray-100">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// Helper component for management links
function ManagementLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4 mb-2">
        {icon}
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      <p className="text-gray-600">{description}</p>
    </Link>
  );
}
