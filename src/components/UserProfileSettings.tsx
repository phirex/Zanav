"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface UserProfile {
  firstName: string;
  lastName: string;
}

export default function UserProfileSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const fetchProfile = useCallback(async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Failed to get user");
      }

      const { data, error } = await supabase
        .from("User")
        .select("firstName, lastName")
        .eq("supabaseUserId", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Create a new user record
          const { data: newUser, error: createError } = await supabase
            .from("User")
            .insert({
              supabaseUserId: user.id,
              email: user.email,
              firstName: "",
              lastName: "",
              name: user.user_metadata?.name || "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .select("firstName, lastName")
            .single();

          if (createError) throw createError;
          if (newUser) {
            setProfile({
              firstName: newUser.firstName || "",
              lastName: newUser.lastName || "",
            });
          }
          return;
        }
        throw error;
      }

      if (data) {
        setProfile({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage({ type: "error", text: t("errorFetchingProfile") });
    }
  }, [supabase, t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Failed to get user");
      }

      const { error } = await supabase
        .from("User")
        .update({
          firstName: profile.firstName,
          lastName: profile.lastName,
          name: `${profile.firstName} ${profile.lastName}`.trim(),
          updatedAt: new Date().toISOString(),
        })
        .eq("supabaseUserId", user.id);

      if (error) throw error;

      // Also update auth user metadata
      await supabase.auth.updateUser({
        data: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          name: `${profile.firstName} ${profile.lastName}`.trim(),
        },
      });

      setMessage({ type: "success", text: t("profileSavedSuccess") });

      // Notify ClientLayout to refresh user name
      console.log("Dispatching profileUpdated event from UserProfileSettings");
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({ type: "error", text: t("errorSavingProfile") });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5" />
        <h2 className="text-lg font-medium">{t("userProfile")}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700"
          >
            {t("firstName")}
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={profile.firstName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700"
          >
            {t("lastName")}
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={profile.lastName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {message && (
          <div
            className={`p-4 rounded-md ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
          >
            {message.text}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? t("saving") : t("saveProfile")}
          </button>
        </div>
      </form>
    </div>
  );
}
