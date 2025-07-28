"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

interface SetupForm {
  kennelName: string;
  subdomain: string;
  firstName: string;
  lastName: string;
}

export default function KennelSetupPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<SetupForm>({
    kennelName: "",
    subdomain: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof SetupForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create kennel (tenant)
      const tenantRes = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.kennelName,
          subdomain: form.subdomain,
        }),
      });
      if (!tenantRes.ok) {
        const err = await tenantRes.json();
        throw new Error(err?.error || "Failed to create kennel");
      }
      const tenantData = await tenantRes.json();
      const tenantId =
        tenantData?.id || tenantData?.tenantId || tenantData?.data?.id;
      console.log("[KENNEL-SETUP] Created tenant:", tenantData);
      console.log("[KENNEL-SETUP] Using tenantId for settings:", tenantId);

      // 1.5. Set kennelName in settings for this tenant using x-tenant-id header
      // (Removed: The backend already inserts kennelName with correct permissions)

      // 2. Update user profile with first/last name
      const profileRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          name: `${form.firstName} ${form.lastName}`.trim(),
        }),
      });
      if (!profileRes.ok) {
        console.warn("Profile update failed, continuing");
      }

      // Success UI then redirect
      setStep(2);
      setTimeout(() => router.push("/dashboard"), 2500);
    } catch (err: any) {
      setError(err.message || "Failed to complete setup");
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">
            {t("setupSuccess", "Setup completed!")}
          </h1>
          <p className="text-gray-600 mb-6">
            {t("redirectingDash", "Redirecting to your dashboard…")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center">
          {t("kennelSetupTitle", "Tell us about your kennel")}
        </h1>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("firstName", "First name")}
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("lastName", "Last name")}
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("kennelName", "Kennel name")}
            </label>
            <input
              type="text"
              value={form.kennelName}
              onChange={(e) => handleChange("kennelName", e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("subdomain", "Subdomain")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.subdomain}
                onChange={(e) => handleChange("subdomain", e.target.value)}
                required
                pattern="[a-z0-9-]+"
                title="Lowercase letters, numbers and hyphens only"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl"
              />
              <span className="text-sm text-gray-500">.zanav.io</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? t("creating", "Creating…")
              : t("finishSetup", "Finish setup")}
          </button>
        </form>
      </div>
    </div>
  );
}
