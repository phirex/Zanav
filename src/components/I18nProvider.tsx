"use client";

import { ReactNode, useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

interface Props {
  children: ReactNode;
}

export default function I18nProviderComponent({ children }: Props) {
  const [isReady, setIsReady] = useState(true); // Start as ready

  useEffect(() => {
    // Simple initialization - just ensure language is set
    const initializeI18n = async () => {
      try {
        // Set default language if not already set
        if (!i18n.language || i18n.language === "cimode") {
          i18n.changeLanguage("en");
        }

        // Set HTML attributes
        const language = i18n.language || "en";
        const direction = language === "he" ? "rtl" : "ltr";

        if (typeof document !== "undefined") {
          document.documentElement.lang = language;
          document.documentElement.dir = direction;
          document.body.style.direction = direction;
        }

        console.log("i18n ready, language:", language);
      } catch (error) {
        console.error("I18n error:", error);
        // Fallback to English
        if (typeof document !== "undefined") {
          document.documentElement.lang = "en";
          document.documentElement.dir = "ltr";
          document.body.style.direction = "ltr";
        }
      }
    };

    initializeI18n();

    // Language change handler
    const handleLanguageChange = (language: string) => {
      if (typeof document !== "undefined") {
        const direction = language === "he" ? "rtl" : "ltr";
        document.documentElement.lang = language;
        document.documentElement.dir = direction;
        document.body.style.direction = direction;
      }
    };

    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
