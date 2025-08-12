let cachedCurrency: string | null = null;

export async function fetchTenantCurrency(): Promise<string> {
  if (cachedCurrency) return cachedCurrency;
  try {
    const res = await fetch("/api/settings", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      const code = (json?.default_currency || "ils").toUpperCase();
      cachedCurrency = code;
      return code;
    }
  } catch {}
  return "ILS";
}

export function getCurrencySymbol(code: string): string {
  const map: Record<string, string> = { USD: "$", ILS: "₪", EUR: "€", GBP: "£" };
  return map[code.toUpperCase()] || code.toUpperCase();
}

export function formatCurrencyIntl(amount: number, currencyCode: string, locale = "en-US"): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: currencyCode }).format(amount);
  } catch {
    return `${getCurrencySymbol(currencyCode)}${amount.toLocaleString(locale)}`;
  }
}
