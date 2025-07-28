import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enCommon from "../../public/locales/en/common.json";
import heCommon from "../../public/locales/he/common.json";

// Preload translations to avoid showing translation keys
const resources = {
  en: {
    common: enCommon,
  },
  he: {
    common: heCommon,
  },
};

// Simple, reliable i18n configuration
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: ["en", "he"],
    interpolation: {
      escapeValue: false,
    },
    resources,
    detection: {
      order: ["localStorage", "cookie", "navigator", "htmlTag"],
      lookupLocalStorage: "i18nextLng",
      lookupCookie: "i18nextLng",
      caches: ["localStorage", "cookie"],
      cookieOptions: {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },
    ns: ["common"],
    defaultNS: "common",
    react: {
      useSuspense: false,
      bindI18n: "languageChanged loaded",
      bindI18nStore: "added removed",
      transEmptyNodeValue: "",
    },
    // Ensure English is default
    lng: "en",
  })
  .then(() => {
    console.log("i18n initialized successfully");
  })
  .catch((error) => {
    console.error("Error initializing i18n:", error);
  });

// Helper function to set direction
function setDirection(lng: string) {
  if (typeof document !== "undefined") {
    if (lng === "en") {
      document.dir = "ltr";
      document.documentElement.setAttribute("dir", "ltr");
      document.documentElement.style.direction = "ltr";
      document.body.style.direction = "ltr";
    } else if (lng === "he") {
      document.dir = "rtl";
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.style.direction = "rtl";
      document.body.style.direction = "rtl";
    }
  }
}

// Update direction on language change
i18n.on("languageChanged", setDirection);

export default i18n;
