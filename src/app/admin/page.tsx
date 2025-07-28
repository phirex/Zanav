import { isGlobalAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import GlobalAdminDashboard from "./components/GlobalAdminDashboard";
import React from "react";

export default async function AdminPage() {
  const isAdmin = await isGlobalAdmin();

  if (!isAdmin) {
    // Redirect non-global admins away from this page
    redirect("/");
  }

  // Render the global admin dashboard for authorized users
  return <GlobalAdminDashboard />;
}

// The previous client-side tenant management code is removed
// as this page is now solely for the global admin dashboard.
// Tenant management UI should reside in /admin/tenants/page.tsx
