"use client";

import { useCallback, useEffect, useState } from "react";
import { IconAlertTriangle, IconBuildingBank, IconRefresh, IconWallet } from "@/components/icons";
import { walletApi } from "@/services/wallet";
import { useMoney } from "./currency";

type WalletTransaction = {
  id: string;
  type: "sale" | "delivery" | "commission" | "payout" | "adjustment";
  amount: number;
  orderId: string | null;
  description: string | null;
  createdAt: string;
};

type Wallet = {
  available: boolean;
  balance: number;
  totalEarned: number;
  totalPaidOut: number;
  commissionRate: number;
  payoutsEnabled: boolean;
  transactions: WalletTransaction[];
};

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
};

const MIGRATION_NOTICE =
  "Wallets need a one-time database update — run backend/database/migrations/007_wallets.sql in the Supabase SQL editor";

const WalletCard = () => {
  const { format } = useMoney();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setWallet((await walletApi.get()) as Wallet);
    } catch (e) {
      setError((e as { message?: string })?.message || "Couldn't load your wallet.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !wallet) {
    return (
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5" aria-busy="true">
        <div className="h-56 animate-pulse rounded-3xl bg-ink/80 lg:col-span-2" />
        <div className="surface-card h-56 animate-pulse lg:col-span-3" />
      </div>
    );
  }

  if (error && !wallet) {
    return (
      <div className="surface-card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <IconAlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-ink">Couldn&apos;t load your wallet</p>
            <p className="text-sm text-black/55">{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-ink/15 px-4 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
        >
          <IconRefresh className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  if (!wallet) return null;

  const rate = Number.isFinite(Number(wallet.commissionRate)) ? Number(wallet.commissionRate) : 5;
  const recent = (wallet.transactions ?? []).slice(0, 5);

  return (
    <div className="space-y-4">
      {!wallet.available && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-600/20">
          <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="min-w-0 flex-1">{MIGRATION_NOTICE}</p>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        {/* Balance (ink card) */}
        <div className="surface-ink relative overflow-hidden p-5 shadow-[0_20px_40px_-20px_rgb(12_17_14/0.5)] sm:p-6 lg:col-span-2">
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-44 w-44 rounded-full border-[22px] border-lime/10" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white/60">Wallet balance</p>
                <p className="mt-0.5 text-xs text-white/45">Available to withdraw</p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lime">
                <IconWallet className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-5 break-all font-space text-4xl font-bold leading-none tracking-tight text-lime sm:text-5xl">
              {format(wallet.balance)}
            </p>

            <div className="mt-5 space-y-2 rounded-2xl bg-white/5 p-3.5 text-sm ring-1 ring-white/10">
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/55">Total earned</span>
                <span className="font-space font-bold">{format(wallet.totalEarned)}</span>
              </div>
              <div className="h-px bg-white/10" />
              <p className="text-xs text-white/55">
                Escro fee: <span className="font-bold text-white">{rate}%</span> of item price
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={!wallet.payoutsEnabled}
                aria-disabled={!wallet.payoutsEnabled}
                className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-white/10 px-5 text-sm font-bold text-white/50 ring-1 ring-white/10 sm:w-auto"
              >
                <IconBuildingBank className="h-4 w-4" />
                Withdraw
              </button>
              <p className="font-space text-[11px] uppercase tracking-widest text-lime">Withdrawals coming soon</p>
            </div>
          </div>
        </div>

        {/* Recent ledger entries */}
        <div className="surface-card min-w-0 overflow-hidden lg:col-span-3">
          <div className="flex items-start justify-between gap-3 border-b border-black/5 p-5 sm:p-6">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-ink">Wallet activity</h2>
              <p className="text-sm text-black/50">Credited when a buyer confirms delivery</p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              aria-label="Refresh wallet"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink/15 text-ink transition-colors hover:border-ink disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
            >
              <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cream text-ink">
                <IconWallet className="h-6 w-6" />
              </div>
              <p className="font-bold text-ink">No wallet activity yet</p>
              <p className="mt-1 max-w-xs text-sm text-black/55">
                When a buyer confirms delivery, your share of the order lands here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {recent.map((t) => {
                const amount = Number(t.amount) || 0;
                const credit = amount >= 0;
                return (
                  <div key={t.id} className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{t.description || t.type}</p>
                      <p className="font-space text-[11px] text-black/45">{fmtDate(t.createdAt)}</p>
                    </div>
                    <p className={`shrink-0 font-space text-sm font-bold ${credit ? "text-emerald-700" : "text-red-600"}`}>
                      {credit ? "+" : "−"}
                      {format(Math.abs(amount))}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
