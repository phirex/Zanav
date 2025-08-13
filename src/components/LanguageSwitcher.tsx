"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import LanguageModal from "./LanguageModal";

export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        aria-label={t("openLanguageSelector", "Open language selector")}
      >
        <Globe className="h-4 w-4" />
        <span>{t("language", "Language")}</span>
      </button>
      <LanguageModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
