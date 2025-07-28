"use client";

import React, { useEffect, useState } from "react";
import { useSupabase } from "@/contexts/SupabaseBrowserContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Note: Client-side admin checks in layouts can be unreliable.
// Prefer middleware or page-level server component checks.

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = useSupabase();

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        // Check user auth status first via the client
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          // Should ideally be caught by middleware, but as a fallback:
          router.push("/login?redirect=/admin");
          return;
        }

        // Fetch admin status from a dedicated API route instead of direct DB check
        // This keeps sensitive logic server-side
        const response = await fetch("/api/admin/status"); // We need to create this route
        if (response.ok) {
          const { isAdmin: adminStatusResult } = await response.json();
          setIsAdmin(adminStatusResult);
          if (!adminStatusResult) {
            // If explicitly not admin, redirect away
            router.push("/");
          }
        } else {
          // Failed to get status, assume not admin for safety
          console.error("Failed to fetch admin status:", response.statusText);
          setIsAdmin(false);
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        // Redirect on error as well
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [router, supabase]);

  if (loading || isAdmin === null) {
    // Show loading while isAdmin is null
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render children only if isAdmin check passed (or if logic determines otherwise)
  // Note: The redirect inside useEffect handles the actual blocking
  // This conditional rendering prevents brief flashes of content for non-admins.
  return isAdmin ? <>{children}</> : null;
}
