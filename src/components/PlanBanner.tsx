"use client";

import { useEffect, useState } from "react";

interface PlanInfo {
  isTrial: boolean;
  trialEndsAt: string;
  graceEndsAt: string;
  effectiveTier: "trial" | "standard" | "pro";
}

export default function PlanBanner() {
  const [info, setInfo] = useState<PlanInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/plan")
      .then((r) => r.json())
      .then((data) => setInfo(data))
      .catch(() => {});
  }, []);

  if (!info || dismissed) return null;

  const now = new Date();
  const trialEnds = new Date(info.trialEndsAt);
  const graceEnds = new Date(info.graceEndsAt);

  let text: string | null = null;
  let tone: "trial" | "grace" | null = null;

  if (now < trialEnds) {
    const days = Math.max(
      0,
      Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );
    text = `Your free trial ends in ${days} day${days === 1 ? "" : "s"}. Enjoy all features — no card required.`;
    tone = "trial";
  } else if (now < graceEnds && info.effectiveTier !== "pro") {
    const days = Math.max(
      0,
      Math.ceil((graceEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );
    text = `Trial ended. You have ${days} day${days === 1 ? "" : "s"} of grace to select a plan.`;
    tone = "grace";
  }

  if (!text) return null;

  const bg =
    tone === "grace"
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : "bg-blue-50 border-blue-200 text-blue-800";

  return (
    <div
      className={`border ${bg} px-4 py-2 text-sm flex items-center justify-between`}
    >
      <div className="pr-3">{text}</div>
      <div className="flex items-center gap-2">
        <a
          href="/settings"
          className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-xs"
        >
          Select plan
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
