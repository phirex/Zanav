"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

interface TenantForm {
  name: string;
  subdomain: string;
}

export default function TenantSetupPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<TenantForm>({ name: "", subdomain: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof TenantForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const { error: errMsg } = await response.json();
        throw new Error(errMsg || "Failed to create tenant");
      }

      const tenant = await response.json();
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedTenantId", tenant.id);
        // Dispatch event to notify ClientLayout to re-initialize
        window.dispatchEvent(
          new CustomEvent("tenantCreated", {
            detail: { tenantId: tenant.id, tenantName: tenant.name },
          }),
        );
      }

      // Immediately show success screen
      setStep(2);
      setLoading(false);

      // Auto-redirect to home page after showing success message
      setTimeout(() => {
        router.push("/");
      }, 3000); // Increased to 3 seconds to actually see the success message
    } catch (err: any) {
      console.error("Error creating tenant:", err);
      setError(err.message || "Failed to create tenant");
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-gray-900">
            {t("tenantSetupSuccess", "Tenant created successfully!")}
          </h1>
          <p className="mb-4 text-gray-600 max-w-md">
            {t(
              "tenantSetupSuccessDesc",
              "Your business page is live! You can now manage your workspace and let customers discover your services.",
            )}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Redirecting to your dashboard...
          </p>
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            onClick={() => router.push("/")}
          >
            {t("continueToApp", "Go to Dashboard")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center">
          {t("tenantSetupTitle", "Set up your workspace")}
        </h1>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("tenantName", "Business name")}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("tenantSubdomain", "Subdomain")}
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
            <p className="text-xs text-gray-400 mt-1">
              {t(
                "tenantSubdomainHint",
                "This will be the web address your customers will visit to view your boarding business and make bookings",
              )}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? t("creating", "Creating...")
              : t("createTenant", "Create tenant")}
          </button>
        </form>
      </div>
    </div>
  );
}
