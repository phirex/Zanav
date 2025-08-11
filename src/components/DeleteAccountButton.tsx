"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DeleteAccountButton() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const router = useRouter();

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to delete account");
      }

      // Clear any tenant selection stored in localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("selectedTenantId");
      }

      // Redirect to landing page
      router.push("/landing");
      router.refresh();
    } catch (error) {
      console.error("Error during account deletion:", error);
      alert(`Failed to delete account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-red-600 font-medium">
          Are you sure? This action cannot be undone.
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDeleteAccount}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Yes, Delete My Account
              </>
            )}
          </button>
          <button
            onClick={() => setShowConfirmation(false)}
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirmation(true)}
      disabled={isLoading}
      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 rounded-xl transition-all duration-200 group"
    >
      <div className="bg-red-100 p-2 rounded-lg group-hover:bg-red-200 transition-colors">
        <Trash2 className="h-5 w-5 text-red-600" />
      </div>
      <span className="font-medium text-red-700">Delete Account</span>
    </button>
  );
} 