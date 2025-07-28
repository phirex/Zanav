import React from "react";
import Link from "next/link";
import { Users, Building, BarChart } from "lucide-react";
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
        {/* Add more relevant stats */}
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
        {/* Add links to other global admin functions like system settings, logs, etc. */}
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
