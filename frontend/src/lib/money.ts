// Locale must match the currency: en-IN's lakh/crore grouping (6,15,000) is
// wrong for IDR/AED/THB, which use standard thousands grouping. AED uses
// en-AE (not ar-AE) to keep Latin digits — Arabic locale digits aren't in
// the loaded font.
const LOCALE_BY_CURRENCY: Record<string, string> = {
  INR: "en-IN",
  IDR: "id-ID",
  AED: "en-AE",
  THB: "en-US",
};

// The Thai baht (฿) and UAE dirham symbols don't render in Plus Jakarta Sans
// — confirmed via an actual rendered screenshot (showed as broken/tofu
// glyphs), not assumed. ₹ and "Rp" render fine, so only these two fall back
// to the currency code instead of the symbol.
const FORCE_CODE_DISPLAY = new Set(["THB", "AED"]);

export function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency] ?? "en-US", {
      style: "currency",
      currency,
      currencyDisplay: FORCE_CODE_DISPLAY.has(currency) ? "code" : "symbol",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}
