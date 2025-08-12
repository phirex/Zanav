import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getCurrencySymbol } from "./currency";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, language?: string, currencyCode?: string): string {
  // If explicit currency code provided, use it
  if (currencyCode) {
    const locale = (language && language.startsWith("he")) ? "he-IL" : "en-US";
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency: currencyCode.toUpperCase() }).format(amount);
    } catch {
      return `${getCurrencySymbol(currencyCode)}${amount.toLocaleString(locale)}`;
    }
  }

  const lang =
    language ||
    (typeof window !== "undefined" ? window.localStorage.getItem("i18nextLng") : "he") ||
    "he";

  if (lang.startsWith("en")) {
    return `$${amount.toLocaleString("en-US")}`;
  } else {
    return `₪${amount.toLocaleString("he-IL")}`;
  }
}

export function formatDateLocale(
  dateInput: string | Date,
  language?: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const lang =
    language ||
    (typeof window !== "undefined" ? window.localStorage.getItem("i18nextLng") : "he") ||
    "he";

  const locale = lang.startsWith("en") ? "en-US" : "he-IL";
  return date.toLocaleDateString(locale, options);
}
