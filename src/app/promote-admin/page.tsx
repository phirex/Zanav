"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PromoteAdminPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handlePromote = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/admin/promote-to-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to promote to admin");
      }

      setSuccess(data.message || "Successfully promoted to global admin");

      // Redirect to main dashboard after successful promotion
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error("Error promoting to admin:", err);
      setError(
        err instanceof Error ? err.message : "Failed to promote to admin",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Promote to Admin</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 mb-6 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-700 p-4 mb-6 rounded">
            {success}
            <p className="mt-2 text-sm">Redirecting to dashboard...</p>
          </div>
        )}

        <p className="mb-6">
          This will promote your current account to a global administrator with
          full system access. Use this only for the first user setup or when you
          need to create a new admin.
        </p>

        <button
          onClick={handlePromote}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400"
        >
          {loading ? "Promoting..." : "Promote to Admin"}
        </button>
      </div>
    </div>
  );
}
