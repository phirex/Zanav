"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function LogoutButton() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(t("errorLogoutFailed"));
      }

      setIsLoggedOut(true);

      // Clear any tenant selection stored in localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("selectedTenantId");
      }

      // Redirect to login page
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoggedOut) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-600">{t("loggedOutMessage")}</p>
        <Link
          href="/login"
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
        >
          <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
            <LogOut className="h-5 w-5 text-blue-600" />
          </div>
          <span className="font-medium">{t("signInAgainLink")}</span>
        </Link>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 rounded-xl transition-all duration-200 group"
    >
      <div className="bg-red-100 p-2 rounded-lg group-hover:bg-red-200 transition-colors">
        <LogOut className="h-5 w-5 text-red-600" />
      </div>
      <span className="font-medium">
        {isLoading ? t("loggingOutButton") : t("logoutButton")}
      </span>
    </button>
  );
}
