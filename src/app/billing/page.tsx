"use client";

import { useEffect, useState } from "react";
import ClientLayout from "../components/ClientLayout";

type PlanInfo = {
  plan: "standard" | "pro";
  isTrial: boolean;
  effectiveTier: "trial" | "standard" | "pro";
  trialEndsAt: string;
  graceEndsAt: string;
  limits: any;
};

export default function BillingPage() {
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plan")
      .then((r) => r.json())
      .then(setPlan)
      .catch(() => setError("Failed to load plan info"));
  }, []);

  const selectPlan = async (nextPlan: "standard" | "pro") => {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: nextPlan }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const info = await res.json();
      setPlan(info);
    } catch (e: any) {
      setError(e?.message || "Failed to update plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClientLayout>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Billing</h1>
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-700">{error}</div>
        )}
        {!plan ? (
          <div>Loading…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className={`border rounded-xl p-6 ${plan.plan === "standard" ? "ring-2 ring-blue-500" : ""}`}
            >
              <h2 className="text-xl font-semibold mb-1">Standard</h2>
              <p className="text-gray-600 mb-4">
                Starter features, basic limits
              </p>
              <ul className="text-sm text-gray-700 mb-6 list-disc pl-5 space-y-1">
                <li>Up to 3 staff users</li>
                <li>Up to 5 rooms</li>
                <li>Up to 5 active templates</li>
                <li>No WhatsApp, custom domain, Stripe, or API</li>
              </ul>
              <button
                disabled={saving || plan.plan === "standard"}
                onClick={() => selectPlan("standard")}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                {plan.plan === "standard"
                  ? "Selected"
                  : saving
                    ? "Saving…"
                    : "Choose Standard"}
              </button>
            </div>
            <div
              className={`border rounded-xl p-6 ${plan.plan === "pro" ? "ring-2 ring-blue-500" : ""}`}
            >
              <h2 className="text-xl font-semibold mb-1">Pro</h2>
              <p className="text-gray-600 mb-4">All features, higher limits</p>
              <ul className="text-sm text-gray-700 mb-6 list-disc pl-5 space-y-1">
                <li>Unlimited staff users</li>
                <li>Unlimited rooms</li>
                <li>Unlimited active templates</li>
                <li>WhatsApp, custom domain, advanced reports, API, Stripe</li>
              </ul>
              <button
                disabled={saving || plan.plan === "pro"}
                onClick={() => selectPlan("pro")}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {plan.plan === "pro"
                  ? "Selected"
                  : saving
                    ? "Saving…"
                    : "Choose Pro"}
              </button>
            </div>
          </div>
        )}
        {plan && plan.isTrial && (
          <div className="mt-6 p-3 rounded bg-blue-50 text-blue-800 text-sm">
            Free trial active. Ends on{" "}
            {new Date(plan.trialEndsAt).toLocaleDateString()}.
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
