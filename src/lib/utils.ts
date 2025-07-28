import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, language?: string): string {
  // Default to the current UI language if not specified
  const lang =
    language ||
    (typeof window !== "undefined"
      ? window.localStorage.getItem("i18nextLng")
      : "he") ||
    "he";

  if (lang.startsWith("en")) {
    // English: USD format
    return `$${amount.toLocaleString("en-US")}`;
  } else {
    // Hebrew or any other language: ILS format
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
    (typeof window !== "undefined"
      ? window.localStorage.getItem("i18nextLng")
      : "he") ||
    "he";

  const locale = lang.startsWith("en") ? "en-US" : "he-IL";
  return date.toLocaleDateString(locale, options);
}
