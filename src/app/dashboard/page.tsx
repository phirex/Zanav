"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ClientLayout from "../components/ClientLayout";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the home page which contains the dashboard content
    router.replace("/");
  }, [router]);

  return (
    <ClientLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    </ClientLayout>
  );
}
