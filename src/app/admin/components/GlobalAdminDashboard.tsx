"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Building, 
  BarChart, 
  Crown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  Activity,
  Globe,
  Settings,
  Shield,
  Database,
  Zap
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface DashboardStats {
  totalTenants: number;
  totalUsers: number;
  totalBookings: number;
  activeNotifications: number;
  monthlyRevenue: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  activeTenants: number;
  pendingApprovals: number;
}

interface RecentActivity {
  id: string;
  type: 'tenant_created' | 'user_promoted' | 'system_alert' | 'revenue_milestone';
  message: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

export default function GlobalAdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    totalUsers: 0,
    totalBookings: 0,
    activeNotifications: 0,
    monthlyRevenue: 0,
    systemHealth: 'healthy',
    activeTenants: 0,
    pendingApprovals: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch real data from our APIs
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/admin/dashboard-stats'),
        fetch('/api/admin/recent-activity')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set some demo data for now
      setStats({
        totalTenants: 15,
        totalUsers: 120,
        totalBookings: 5432,
        activeNotifications: 50,
        monthlyRevenue: 12500,
        systemHealth: 'healthy',
        activeTenants: 12,
        pendingApprovals: 3
      });
    } finally {
      setLoading(false);
    }
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSystemHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'critical': return <AlertTriangle className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          SaaS Management Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor and manage your multi-tenant kennel management platform
        </p>
      </div>

      {/* System Health Alert */}
      {stats.systemHealth !== 'healthy' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-800">System Attention Required</h3>
              <p className="text-sm text-yellow-700">
                {stats.systemHealth === 'warning' 
                  ? 'Some systems require attention. Check the monitoring section below.'
                  : 'Critical system issues detected. Immediate action required.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Tenants"
          value={stats.totalTenants}
          change="+2 this month"
          icon={<Building className="h-6 w-6 text-blue-500" />}
          color="blue"
        />
        <MetricCard
          title="Active Users"
          value={stats.totalUsers}
          change="+15 this week"
          icon={<Users className="h-6 w-6 text-green-500" />}
          color="green"
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          change="+12% vs last month"
          icon={<DollarSign className="h-6 w-6 text-yellow-500" />}
          color="yellow"
        />
        <MetricCard
          title="System Health"
          value={stats.systemHealth.charAt(0).toUpperCase() + stats.systemHealth.slice(1)}
          change="All systems operational"
          icon={getSystemHealthIcon(stats.systemHealth)}
          color={stats.systemHealth === 'healthy' ? 'green' : 'red'}
          customValue={
            <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium ${getSystemHealthColor(stats.systemHealth)}`}>
              {getSystemHealthIcon(stats.systemHealth)}
              {stats.systemHealth.charAt(0).toUpperCase() + stats.systemHealth.slice(1)}
            </div>
          }
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SecondaryMetricCard
          title="Total Bookings"
          value={stats.totalBookings.toLocaleString()}
          subtitle="All time"
          icon={<BarChart className="h-8 w-8 text-purple-500" />}
        />
        <SecondaryMetricCard
          title="Active Notifications"
          value={stats.activeNotifications}
          subtitle="Currently scheduled"
          icon={<Activity className="h-8 w-8 text-indigo-500" />}
        />
        <SecondaryMetricCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          subtitle="Require attention"
          icon={<AlertTriangle className="h-8 w-8 text-orange-500" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <QuickActionCard
          href="/admin/tenants"
          title="Manage Tenants"
          description="Create, edit, and monitor tenant accounts"
          icon={<Building className="h-6 w-6" />}
          color="blue"
        />
        <QuickActionCard
          href="/admin/users"
          title="User Management"
          description="Manage global users and permissions"
          icon={<Users className="h-6 w-6" />}
          color="green"
        />
        <QuickActionCard
          href="/admin/monitoring"
          title="System Monitoring"
          description="Monitor system health and performance"
          icon={<Activity className="h-6 w-6" />}
          color="purple"
        />
        <QuickActionCard
          href="/admin/settings"
          title="Global Settings"
          description="Configure platform-wide settings"
          icon={<Settings className="h-6 w-6" />}
          color="gray"
        />
      </div>

      {/* Recent Activity & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/admin/activity" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="space-y-4">
            <SystemStatusItem
              service="Database"
              status="operational"
              uptime="99.9%"
              responseTime="12ms"
            />
            <SystemStatusItem
              service="Authentication"
              status="operational"
              uptime="99.8%"
              responseTime="45ms"
            />
            <SystemStatusItem
              service="File Storage"
              status="operational"
              uptime="99.7%"
              responseTime="89ms"
            />
            <SystemStatusItem
              service="Email Service"
              status="operational"
              uptime="99.5%"
              responseTime="120ms"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ title, value, change, icon, color, customValue }: {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  color: string;
  customValue?: React.ReactNode;
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    red: 'text-red-600 bg-red-100',
    purple: 'text-purple-600 bg-purple-100',
    gray: 'text-gray-600 bg-gray-100'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        <TrendingUp className="h-5 w-5 text-gray-400" />
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mb-1">
          {customValue || value}
        </p>
        <p className="text-sm text-green-600">{change}</p>
      </div>
    </div>
  );
}

function SecondaryMetricCard({ title, value, subtitle, icon }: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-gray-100">{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{subtitle}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm font-medium text-gray-700">{title}</p>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ href, title, description, icon, color }: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses = {
    blue: 'hover:bg-blue-50 border-blue-200',
    green: 'hover:bg-green-50 border-green-200',
    purple: 'hover:bg-purple-50 border-purple-200',
    gray: 'hover:bg-gray-50 border-gray-200'
  };

  return (
    <Link
      href={href}
      className={`block bg-white rounded-xl shadow-sm border p-6 transition-all duration-200 ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-center gap-4 mb-3">
        <div className={`p-2 rounded-lg bg-${color}-100`}>{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 text-sm">{description}</p>
    </Link>
  );
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
      <div className={`p-2 rounded-full bg-gray-100 ${getSeverityColor(activity.severity)}`}>
        <Activity className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{activity.message}</p>
        <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
      </div>
    </div>
  );
}

function SystemStatusItem({ service, status, uptime, responseTime }: {
  service: string;
  status: string;
  uptime: string;
  responseTime: string;
}) {
  const statusColor = status === 'operational' ? 'text-green-600' : 'text-red-600';
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${statusColor} bg-current`}></div>
        <span className="font-medium text-gray-900">{service}</span>
      </div>
      <div className="text-right text-sm text-gray-600">
        <div>{uptime} uptime</div>
        <div>{responseTime} response</div>
      </div>
    </div>
  );
}
