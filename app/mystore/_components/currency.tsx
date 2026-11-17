"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { sellerService } from "@/services/seller";

/**
 * Store currency for the seller dashboard.
 * The currency comes from Settings → General → Currency (stores.currency).
 *
 *   const { format, currency, symbol } = useMoney();
 *   format(1500)            // "₦1,500.00"
 *   format(1500, { compact: true }) // "₦1.5K"
 */

const STORAGE_KEY = "escro:store-currency";
const DEFAULT_CURRENCY = "ngn";

type FormatOptions = { compact?: boolean; decimals?: number };

type MoneyContext = {
  currency: string; // lower-case ISO code, e.g. "ngn"
  symbol: string; // e.g. "₦"
  format: (amount: number | string | null | undefined, options?: FormatOptions) => string;
  setCurrency: (code: string) => void;
};

const readCached = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
};

function makeFormatter(code: string) {
  const iso = (code || DEFAULT_CURRENCY).toUpperCase();
  const cache = new Map<string, Intl.NumberFormat>();
  const get = (opts: FormatOptions) => {
    const key = `${opts.compact ? "c" : "f"}:${opts.decimals ?? "d"}`;
    if (!cache.has(key)) {
      try {
        cache.set(
          key,
          new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: iso,
            currencyDisplay: "narrowSymbol",
            notation: opts.compact ? "compact" : "standard",
            minimumFractionDigits: opts.decimals ?? (opts.compact ? 0 : 2),
            maximumFractionDigits: opts.decimals ?? (opts.compact ? 1 : 2),
          })
        );
      } catch {
        // Unknown currency code: fall back to NGN
        cache.set(key, new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }));
      }
    }
    return cache.get(key)!;
  };
  const format = (amount: number | string | null | undefined, opts: FormatOptions = {}) => {
    const n = Number(amount);
    return get(opts).format(Number.isFinite(n) ? n : 0);
  };
  const symbol =
    get({ decimals: 0 })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value || iso;
  return { format, symbol };
}

const Ctx = createContext<MoneyContext | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState(DEFAULT_CURRENCY);

  const setCurrency = useCallback((code: string) => {
    const next = (code || DEFAULT_CURRENCY).toLowerCase();
    setCurrencyState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    // apply the cached currency right after hydration, then refresh from the API
    Promise.resolve().then(() => setCurrencyState(readCached()));
    sellerService
      .getProfile()
      .then((p: { store?: { settings?: { currency?: string | null } } | null }) => {
        if (p?.store?.settings?.currency) setCurrency(p.store.settings.currency);
      })
      .catch(() => {
        /* keep cached/default */
      });
  }, [setCurrency]);

  const value = useMemo(() => {
    const { format, symbol } = makeFormatter(currency);
    return { currency, symbol, format, setCurrency };
  }, [currency, setCurrency]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMoney(): MoneyContext {
  const ctx = useContext(Ctx);
  if (ctx) return ctx;
  // Outside the provider: still format sensibly with the default currency.
  const { format, symbol } = makeFormatter(DEFAULT_CURRENCY);
  return { currency: DEFAULT_CURRENCY, symbol, format, setCurrency: () => {} };
}
