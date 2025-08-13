"use client";

import { useMemo, useState } from "react";
import { X, Check, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

export type LanguageCode = "en" | "he";

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "he", name: "Hebrew", nativeName: "עברית" },
];

export default function LanguageModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { i18n, t } = useTranslation();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q),
    );
  }, [query]);

  const selectLanguage = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("chooseLanguage", "Choose your language")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100"
            aria-label={t("close", "Close")}
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="px-5 py-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchLanguages", "Search languages")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="px-3 pb-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.map((lang) => {
              const isActive = i18n.language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => selectLanguage(lang.code)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left hover:bg-gray-50 ${
                    isActive
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {lang.name}
                    </div>
                    <div className="text-xs text-gray-500">{lang.nativeName}</div>
                  </div>
                  {isActive && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export { SUPPORTED_LANGUAGES };


