/**
 * Format an amount in a store's currency.
 *   formatMoney(1500)                 → "₦1,500.00"
 *   formatMoney(1500, "usd")          → "$1,500.00"
 *   formatMoney(1500, "ngn", { compact: true }) → "₦1.5K"
 */
const cache = new Map<string, Intl.NumberFormat>();

export function formatMoney(
  amount: number | string | null | undefined,
  currency: string | null | undefined = "ngn",
  opts: { compact?: boolean; decimals?: number } = {}
): string {
  const iso = (currency || "ngn").toUpperCase();
  const key = `${iso}:${opts.compact ? "c" : "f"}:${opts.decimals ?? "d"}`;
  let fmt = cache.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: iso,
        currencyDisplay: "narrowSymbol",
        notation: opts.compact ? "compact" : "standard",
        minimumFractionDigits: opts.decimals ?? (opts.compact ? 0 : 2),
        maximumFractionDigits: opts.decimals ?? (opts.compact ? 1 : 2),
      });
    } catch {
      fmt = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" });
    }
    cache.set(key, fmt);
  }
  const n = Number(amount);
  return fmt.format(Number.isFinite(n) ? n : 0);
}
