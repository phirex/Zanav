"use client";

import { useState, useEffect } from "react";
import ClientLayout from "../components/ClientLayout";
import { useSupabase } from "@/contexts/SupabaseBrowserContext";
import { useTranslation } from "react-i18next";

type UserProfile = {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
};

function ProfileContent() {
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    // Fetch user profile
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/profile");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch profile");
        }

        const data = await response.json();
        setProfile(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      setSuccess(t("profileUpdateSuccess"));

      // Update profile state
      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim(),
          updatedAt: new Date().toISOString(),
        };
      });

      // Notify ClientLayout to refresh user name
      console.log("Dispatching profileUpdated event");
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Profile</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">
            {t("profilePersonalInfo")}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("profileEmail")}
                </label>
                <input
                  type="email"
                  id="email"
                  value={profile?.email || ""}
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2"
                  disabled
                />
                <p className="mt-1 text-sm text-gray-500">
                  {t("profileEmailCannotChange")}
                </p>
              </div>

              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("profileFirstName")}
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t("profileFirstName")}
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("profileLastName")}
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t("profileLastName")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profileMemberSince")}
                </label>
                <div className="text-gray-700 py-2">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>{t("profileSaving")}</span>
                  </>
                ) : (
                  <span>{t("profileSaveChanges")}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ClientLayout>
      <ProfileContent />
    </ClientLayout>
  );
}
