"use client";

import { useState, useEffect, useCallback } from "react";
import ClientLayout from "../components/ClientLayout";
import {
  Settings as SettingsIcon,
  MessageSquare,
  Save,
  Link as LinkIcon,
  Plus,
  Building,
  Upload,
  Database,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { useTranslation } from "react-i18next";
import { fetchWithTenant, createTenantHeaders } from "@/lib/client-tenant";

// Initialize Supabase client
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface Room {
  id: number;
  name: string;
  displayName: string;
  capacity: number;
  maxCapacity: number;
}

interface WhatsAppSettings {
  whatsappAccountSid: string;
  whatsappAuthToken: string;
  whatsappPhoneNumber: string;
  whatsappEnabled: boolean;
}

interface KennelSettings {
  kennelName: string;
  tenantId: string;
  defaultLanguage?: string;
}

// New room form state
interface NewRoomForm {
  name: string;
  displayName: string;
  maxCapacity: number;
}

function SettingsContent() {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [initialized] = useState(true);

  // Add state for new room form
  const [showNewRoomForm, setShowNewRoomForm] = useState(false);
  const [newRoom, setNewRoom] = useState<NewRoomForm>({
    name: "",
    displayName: "",
    maxCapacity: 1,
  });
  const [addingRoom, setAddingRoom] = useState(false);

  const [whatsappSettings, setWhatsappSettings] = useState<WhatsAppSettings>({
    whatsappAccountSid: "",
    whatsappAuthToken: "",
    whatsappPhoneNumber: "",
    whatsappEnabled: false,
  });
  const [planInfo, setPlanInfo] = useState<any | null>(null);

  const [kennelSettings, setKennelSettings] = useState<KennelSettings>({
    kennelName: "",
    tenantId: "",
    defaultLanguage: "",
  });

  const [importing, setImporting] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<{
    connected?: boolean;
    configured?: boolean;
    accountId?: string;
  } | null>(null);
  const [pricingSettings, setPricingSettings] = useState<{
    pricePerDay: string;
    currency: string;
  }>({ pricePerDay: "", currency: "usd" });
  const [demoBusy, setDemoBusy] = useState(false);

  const fetchRooms = useCallback(async () => {
    if (!initialized) return;

    try {
      const data = await fetchWithTenant<Room[]>("/api/rooms");
      if (Array.isArray(data)) {
        setRooms(data);
      } else {
        console.error("Invalid rooms data format:", data);
        setRooms([]);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setRooms([]);
      if (error instanceof Error) {
        setMessage({ type: "error", text: error.message });
      }
    }
  }, [initialized]);

  useEffect(() => {
    fetch("/api/plan")
      .then((r) => r.json())
      .then(setPlanInfo)
      .catch(() => {});
  }, []);

  const fetchSettings = useCallback(async () => {
    if (!initialized) return;

    try {
      const data =
        await fetchWithTenant<Record<string, string>>("/api/settings");
      if (!data) {
        console.error("No settings data received");
        return;
      }

      setWhatsappSettings({
        whatsappAccountSid: data.whatsappAccountSid || "",
        whatsappAuthToken: data.whatsappAuthToken || "",
        whatsappPhoneNumber: data.whatsappPhoneNumber || "",
        whatsappEnabled: data.whatsappEnabled === "true",
      });

      // Only override kennelName if present in settings; otherwise keep tenant-derived value
      setKennelSettings((prev) => ({
        ...prev,
        kennelName: data.kennelName || data.businessName || prev.kennelName,
      }));

      setPricingSettings({
        pricePerDay: data.default_price_per_day || "",
        currency: (data.default_currency || "usd").toLowerCase(),
      });

      setKennelSettings((prev) => ({
        ...prev,
        defaultLanguage: (data.default_language || "").toLowerCase(),
      }));
    } catch (error) {
      console.error("Error fetching settings:", error);
      if (error instanceof Error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ type: "error", text: t("errorFetchingSettings") });
      }
    }
  }, [initialized, t]);

  const fetchTenantName = useCallback(async () => {
    try {
      const headers = createTenantHeaders();
      const response = await fetch("/api/tenants/current", { headers });

      if (response.ok) {
        const tenantData = await response.json();
        setKennelSettings((prev) => ({
          ...prev,
          kennelName: tenantData.name || prev.kennelName || "",
          tenantId: tenantData.id || prev.tenantId || "",
        }));
      } else {
        console.warn(
          "/api/tenants/current not OK (",
          response.status,
          ") — preserving existing kennel name",
        );
        // Preserve existing values on failure to avoid UI blanking
        setKennelSettings((prev) => ({ ...prev }));
      }
    } catch (error) {
      console.error("Error fetching tenant name:", error);
      // Preserve existing values on error too
      setKennelSettings((prev) => ({ ...prev }));
    }
  }, []);

  const loadStripeStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/payments/stripe/connect/status", {
        headers: createTenantHeaders(),
      });
      if (res.ok) setStripeStatus(await res.json());
    } catch {}
  }, []);

  const generateDemoData = async () => {
    if (demoBusy) return;
    setDemoBusy(true);
    try {
      const res = await fetchWithTenant("/api/generate-demo-data", {
        method: "POST",
      });
      const ok = (res as any)?.success !== false;
      setMessage({
        type: ok ? "success" : "error",
        text: ok
          ? t("demoGenerated", "Demo data generated")
          : t("demoFailed", "Failed to generate demo data"),
      });
    } catch (e) {
      setMessage({
        type: "error",
        text: t("demoFailed", "Failed to generate demo data"),
      });
    } finally {
      setDemoBusy(false);
    }
  };

  const restoreWebsiteContent = async () => {
    if (demoBusy) return;
    setDemoBusy(true);
    try {
      const res = await fetchWithTenant("/api/restore-website-content", {
        method: "POST",
      });
      const ok = (res as any)?.success !== false;
      setMessage({
        type: ok ? "success" : "error",
        text: ok
          ? t("websiteRestored", "Website content restored")
          : t("websiteRestoreFailed", "Failed to restore website content"),
      });
    } catch (e) {
      setMessage({
        type: "error",
        text: t("websiteRestoreFailed", "Failed to restore website content"),
      });
    } finally {
      setDemoBusy(false);
    }
  };

  useEffect(() => {
    // Load tenant first to avoid intermediate blanking, then settings/rooms
    (async () => {
      await fetchTenantName();
      await Promise.all([fetchSettings(), fetchRooms()]);
      loadStripeStatus();
    })();
  }, [fetchRooms, fetchSettings, fetchTenantName, loadStripeStatus]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      // Make sure rooms is an array before mapping
      const updates = Array.isArray(rooms)
        ? rooms.map((room) => ({
            id: room.id,
            maxCapacity: parseInt(
              formData.get(`maxCapacity-${room.id}`) as string,
            ),
          }))
        : [];

      const headers = createTenantHeaders({
        "Content-Type": "application/json",
      });

      const response = await fetch("/api/rooms/update-capacity", {
        method: "POST",
        headers,
        body: JSON.stringify({ rooms: updates }),
      });

      if (!response.ok) throw new Error("Failed to update rooms");

      setMessage({ type: "success", text: t("settingsSavedSuccess") });
      fetchRooms();
    } catch (error) {
      setMessage({ type: "error", text: t("errorSavingSettings") });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const headers = createTenantHeaders({
        "Content-Type": "application/json",
      });

      // Convert boolean to string for storage
      const settingsToSave = {
        ...whatsappSettings,
        whatsappEnabled: whatsappSettings.whatsappEnabled.toString(),
      };

      const response = await fetch("/api/settings", {
        method: "POST",
        headers,
        body: JSON.stringify(settingsToSave),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to update WhatsApp settings",
        );
      }

      setMessage({ type: "success", text: t("whatsappSettingsSaved") });
      await fetchSettings(); // Refresh settings after save
    } catch (error) {
      console.error("Error saving WhatsApp settings:", error);
      setMessage({ type: "error", text: t("errorSavingWhatsapp") });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setWhatsappSettings((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setWhatsappSettings((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const whatsappLocked =
    planInfo &&
    planInfo.effectiveTier !== "trial" &&
    !planInfo.limits?.features?.whatsapp;

  const handleAddRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddingRoom(true);
    setMessage(null);

    const form = e.currentTarget as HTMLFormElement; // capture form before await to avoid React event pooling issues

    const formData = new FormData(form);
    const payload = {
      name: formData.get("name") as string,
      displayName: formData.get("displayName") as string,
      maxCapacity: parseInt(formData.get("maxCapacity") as string),
    };

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: createTenantHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add room");
      }

      setMessage({
        type: "success",
        text: t("roomAddedSuccess", "Room added successfully"),
      });
      fetchRooms();
      form.reset();
    } catch (error) {
      console.error("Error adding room:", error);
      setMessage({
        type: "error",
        text: t("errorAddingRoom", "Failed to add room"),
      });
    } finally {
      setAddingRoom(false);
    }
  };

  const handleNewRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRoom((prev) => ({
      ...prev,
      [name]: name === "maxCapacity" ? parseInt(value) || 0 : value,
    }));
  };

  const handleKennelSettingsSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const headers = createTenantHeaders({
        "Content-Type": "application/json",
      });

      // Update both settings and tenant name
      const [settingsResponse, tenantResponse] = await Promise.all([
        fetch("/api/settings", {
          method: "POST",
          headers,
          body: JSON.stringify({
            kennelName: kennelSettings.kennelName,
            default_language: (
              kennelSettings.defaultLanguage || ""
            ).toLowerCase(),
          }),
        }),
        fetch("/api/tenants/current", {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            name: kennelSettings.kennelName,
          }),
        }),
      ]);

      if (!settingsResponse.ok)
        throw new Error("Failed to update kennel settings");
      if (!tenantResponse.ok) throw new Error("Failed to update tenant name");

      setMessage({
        type: "success",
        text: t(
          "kennelSettingsSavedSuccess",
          "Kennel settings saved successfully",
        ),
      });

      // Refresh the tenant name
      await fetchTenantName();

      // Dispatch event to refresh dashboard and other components that show kennel name
      window.dispatchEvent(new CustomEvent("kennelSettingsUpdated"));
    } catch (error) {
      setMessage({
        type: "error",
        text: t("errorSavingKennelSettings", "Error saving kennel settings"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKennelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setKennelSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImportCsv = async () => {
    if (importing) return;
    setImporting(true);
    try {
      const res = await fetchWithTenant<{
        success: boolean;
        ownersImported: number;
      }>("/api/import-csv", { method: "POST" });
      alert(`Imported ${res.ownersImported} owners from CSV`);
    } catch (e: any) {
      alert(`Import failed: ${e.message}`);
    } finally {
      setImporting(false);
    }
  };

  const startStripeOnboarding = async () => {
    try {
      const res = await fetch("/api/payments/stripe/connect/start", {
        method: "POST",
        headers: createTenantHeaders(),
      });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch {}
  };

  const handlePricingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const headers = createTenantHeaders({
        "Content-Type": "application/json",
      });
      const response = await fetch("/api/settings", {
        method: "POST",
        headers,
        body: JSON.stringify({
          default_price_per_day: pricingSettings.pricePerDay,
          default_currency: pricingSettings.currency,
        }),
      });
      if (!response.ok) throw new Error("Failed to update pricing settings");
      setMessage({ type: "success", text: "Pricing settings saved" });
      await fetchSettings();
    } catch (e) {
      setMessage({ type: "error", text: t("errorSavingSettings") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("kennelSettingsTitle", "Kennel Settings")}
          </h1>
          <p className="text-gray-500 mt-1">
            {t(
              "kennelSettingsSubtitle",
              "Manage your kennel configuration, rooms, and communication settings",
            )}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-2 text-gray-700 mb-6 justify-between">
              <Building className="h-5 w-5" />
              <h2 className="text-xl font-bold">
                {t("kennelInformation", "Kennel Information")}
              </h2>

              <button
                onClick={handleImportCsv}
                disabled={importing}
                className="text-sm flex items-center gap-1 px-3 py-1 bg-green-100 hover:bg-green-200 rounded-md text-green-700 disabled:opacity-50"
                title={t("importCsvData", "Import CSV data")}
              >
                <Upload className="h-4 w-4" />{" "}
                {importing
                  ? t("importing", "Importing…")
                  : t("importCsv", "Import CSV")}
              </button>
            </div>

            <form onSubmit={handleKennelSettingsSubmit} className="space-y-6">
              <div className="space-y-1">
                <label
                  htmlFor="kennelName"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("kennelName", "Kennel Name")}
                </label>
                <input
                  type="text"
                  id="kennelName"
                  name="kennelName"
                  value={kennelSettings.kennelName}
                  onChange={handleKennelChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("enterKennelName", "Enter your kennel name")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("defaultLanguage", "Default language")}
                  </label>
                  <select
                    value={kennelSettings.defaultLanguage || ""}
                    onChange={(e) =>
                      setKennelSettings((prev) => ({
                        ...prev,
                        defaultLanguage: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">
                      {t("systemDefault", "System default")}
                    </option>
                    <option value="en">English</option>
                    <option value="he">עברית</option>
                  </select>
                </div>
              </div>

              {message && (
                <div
                  className={`p-4 rounded-xl ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading
                    ? t("saving", "Saving...")
                    : t("saveKennelSettings", "Save Kennel Settings")}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Data & Demo tools */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-2 text-gray-700 mb-6">
              <Database className="h-5 w-5" />
              <h2 className="text-xl font-bold">
                {t("dataAndDemo", "Data & Demo Tools")}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={generateDemoData}
                disabled={demoBusy}
                className="px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 disabled:opacity-50"
              >
                {demoBusy
                  ? t("working", "Working…")
                  : t("generateDemoData", "Generate Demo Data")}
              </button>
              <button
                onClick={restoreWebsiteContent}
                disabled={demoBusy}
                className="px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />{" "}
                {demoBusy
                  ? t("working", "Working…")
                  : t("restoreWebsite", "Restore Website Content")}
              </button>
            </div>
          </div>
        </div>

        {/* Stripe Payments */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between text-gray-700 mb-6">
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                <h2 className="text-xl font-bold">Payments (Stripe)</h2>
              </div>
              <button
                onClick={startStripeOnboarding}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                {stripeStatus?.connected ? "Reconnect" : "Connect Stripe"}
              </button>
            </div>
            <p className="text-gray-600 text-sm">
              {stripeStatus?.configured === false
                ? "Stripe not configured on platform"
                : stripeStatus?.connected
                  ? `Connected (account ${stripeStatus.accountId})`
                  : "Not connected"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between text-gray-700 mb-6">
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                <h2 className="text-xl font-bold">Pricing</h2>
              </div>
            </div>
            <form
              onSubmit={handlePricingSubmit}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-sm text-gray-600">
                  Default Price / Day
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricingSettings.pricePerDay}
                  onChange={(e) =>
                    setPricingSettings((s) => ({
                      ...s,
                      pricePerDay: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Currency</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={pricingSettings.currency}
                  onChange={(e) =>
                    setPricingSettings((s) => ({
                      ...s,
                      currency: e.target.value,
                    }))
                  }
                >
                  <option value="usd">USD</option>
                  <option value="eur">EUR</option>
                  <option value="ils">ILS</option>
                  <option value="gbp">GBP</option>
                </select>
              </div>
              <div className="flex items-end justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Link
            href="/settings/templates"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 text-gray-700 mb-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold">{t("messageTemplates")}</h2>
            </div>
            <p className="text-gray-500">{t("manageTemplates")}</p>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-2 text-gray-700 mb-6">
              <MessageSquare className="h-5 w-5" />
              <h2 className="text-xl font-bold">{t("whatsappSettings")}</h2>
            </div>

            <form onSubmit={handleWhatsAppSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center gap-2 p-4 bg-blue-50 text-blue-800 rounded-xl mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="whatsappEnabled"
                      name="whatsappEnabled"
                      checked={whatsappSettings.whatsappEnabled}
                      onChange={handleWhatsAppChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="whatsappEnabled"
                      className="mr-2 block font-medium"
                    >
                      {t("enableWhatsapp")}
                    </label>
                  </div>
                  <div className="text-sm">
                    {whatsappSettings.whatsappEnabled
                      ? t("whatsappEnabled")
                      : t("whatsappDisabled")}
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="whatsappAccountSid"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("twilioAccountSid")}
                  </label>
                  <input
                    type="text"
                    id="whatsappAccountSid"
                    name="whatsappAccountSid"
                    value={whatsappSettings.whatsappAccountSid}
                    onChange={handleWhatsAppChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="whatsappAuthToken"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("twilioAuthToken")}
                  </label>
                  <input
                    type="password"
                    id="whatsappAuthToken"
                    name="whatsappAuthToken"
                    value={whatsappSettings.whatsappAuthToken}
                    onChange={handleWhatsAppChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="whatsappPhoneNumber"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("twilioWhatsappNumber")}
                  </label>
                  <input
                    type="text"
                    id="whatsappPhoneNumber"
                    name="whatsappPhoneNumber"
                    value={whatsappSettings.whatsappPhoneNumber}
                    onChange={handleWhatsAppChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+972xxxxxxxxx"
                  />
                </div>
              </div>

              {message && (
                <div
                  className={`p-4 rounded-xl ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? t("saving") : t("saveWhatsappSettings")}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between text-gray-700 mb-6">
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                <h2 className="text-xl font-bold">{t("roomSettings")}</h2>
              </div>

              <button
                type="button"
                onClick={() => setShowNewRoomForm(!showNewRoomForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                {showNewRoomForm ? t("cancel") : t("addNewRoom")}
              </button>
            </div>

            {showNewRoomForm && (
              <div className="mb-8 p-4 border border-green-100 bg-green-50 rounded-xl">
                <h3 className="font-medium text-gray-900 mb-4">
                  {t("addNewRoom")}
                </h3>

                <form onSubmit={handleAddRoom} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t("internalName")}
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={newRoom.name}
                        onChange={handleNewRoomChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t("internalName")}
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="displayName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t("displayName")}
                      </label>
                      <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        required
                        value={newRoom.displayName}
                        onChange={handleNewRoomChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t("displayName")}
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="maxCapacity"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t("maxCapacity")}
                      </label>
                      <input
                        type="number"
                        id="maxCapacity"
                        name="maxCapacity"
                        required
                        min="1"
                        value={newRoom.maxCapacity}
                        onChange={handleNewRoomChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={addingRoom}
                      className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {addingRoom ? t("adding") : t("addRoom")}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6">
                {Array.isArray(rooms) && rooms.length > 0 ? (
                  rooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {room.displayName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {t("currentCapacity", { capacity: room.capacity })}
                        </p>
                      </div>
                      <div className="w-48">
                        <label
                          htmlFor={`maxCapacity-${room.id}`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          {t("maxCapacity")}
                        </label>
                        <input
                          type="number"
                          id={`maxCapacity-${room.id}`}
                          name={`maxCapacity-${room.id}`}
                          value={room.maxCapacity}
                          onChange={(e) => {
                            const newMaxCapacity = parseInt(e.target.value);
                            setRooms((prevRooms) =>
                              prevRooms.map((r) =>
                                r.id === room.id
                                  ? { ...r, maxCapacity: newMaxCapacity }
                                  : r,
                              ),
                            );
                          }}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t("maxCapacity")}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-gray-500">
                    {t("noRoomsToDisplay")}
                  </div>
                )}
              </div>

              {message && (
                <div
                  className={`p-4 rounded-xl ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    loading || !Array.isArray(rooms) || rooms.length === 0
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? t("saving") : t("saveRoomSettings")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ClientLayout>
      <SettingsContent />
    </ClientLayout>
  );
}
