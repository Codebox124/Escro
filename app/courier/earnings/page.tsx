"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconBuildingBank,
  IconCalendarMonth,
  IconCalendarWeek,
  IconChartBar,
  IconCurrencyNaira,
  IconDownload,
  IconPackage,
  IconRefresh,
  IconWallet,
} from "@/components/icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { courierApi } from "@/services/courier";
import { walletApi } from "@/services/wallet";
import { formatMoney } from "@/lib/money";

// ---------------------------------------------------------------- types

type ChartPoint = { label: string; date: string; amount: number; deliveries: number };

type Transaction = {
  id: string;
  amount: number;
  orderNumber: string | null;
  store: string | null;
  date: string;
};

type Earnings = {
  total: number;
  today: number;
  week: number;
  month: number;
  deliveries: { today: number; week: number; month: number; total: number };
  averagePerDelivery: number;
  chart: ChartPoint[];
  transactions: Transaction[];
  payoutsEnabled: boolean;
};

type Wallet = {
  available: boolean;
  balance: number;
  totalEarned: number;
  totalPaidOut: number;
  commissionRate: number;
  payoutsEnabled: boolean;
  transactions: Array<{ id: string; type: string; amount: number; orderId: string | null; description: string | null; createdAt: string }>;
};

// ---------------------------------------------------------------- helpers

const money = (n: number | null | undefined) => formatMoney(n ?? 0, "ngn");
const moneyCompact = (n: number | null | undefined) => formatMoney(n ?? 0, "ngn", { compact: true });

const errMessage = (e: unknown, fallback: string) =>
  (e as { message?: string })?.message || fallback;

const deliveriesWord = (n: number) => `${n} ${n === 1 ? "delivery" : "deliveries"}`;

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

function exportCsv(transactions: Transaction[]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [
    ["Date", "Order number", "Store", "Amount (NGN)"],
    ...transactions.map((t) => [
      t.date ? new Date(t.date).toISOString() : "",
      t.orderNumber ?? "",
      t.store ?? "",
      Number(t.amount || 0).toFixed(2),
    ]),
  ];
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `escro-courier-earnings-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------- pieces

const EarningsStatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}) => (
  <div className="group surface-card card-hover relative p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 pt-1">
        <p className="eyebrow font-space text-[10px] text-black/50 sm:text-[11px]">{title}</p>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-ink transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-11">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <div className="mt-4">
      <h3 className="truncate font-space text-2xl font-bold tracking-tight text-ink sm:text-3xl">{value}</h3>
    </div>
    <p className="mt-1 text-xs text-black/50 sm:text-sm">{subtitle}</p>
  </div>
);

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload?: ChartPoint }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const count = payload[0].payload?.deliveries ?? 0;
    return (
      <div className="rounded-2xl bg-ink px-4 py-2 text-white shadow-lg">
        <p className="font-space text-[11px] uppercase tracking-widest text-white/50">{label}</p>
        <p className="font-space font-bold text-lime">{money(payload[0].value)}</p>
        <p className="font-space text-[11px] text-white/60">{deliveriesWord(count)}</p>
      </div>
    );
  }
  return null;
};

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6 sm:space-y-8" aria-hidden>
      <div className="h-56 rounded-3xl bg-ink/80 sm:h-64" />
      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 rounded-3xl bg-white ring-1 ring-black/5" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
        <div className="h-80 rounded-3xl bg-white ring-1 ring-black/5 lg:col-span-3" />
        <div className="h-80 rounded-3xl bg-white ring-1 ring-black/5 lg:col-span-2" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- page

export default function EarningsPage() {
  const [data, setData] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Wallet is optional: a failure here shouldn't block the earnings page
    walletApi
      .get()
      .then((w: Wallet) => setWallet(w))
      .catch(() => setWallet(null));
    try {
      const res = (await courierApi.earnings()) as Earnings;
      setData(res);
    } catch (e) {
      setError(errMessage(e, "Couldn't load your earnings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const chart = useMemo(() => data?.chart ?? [], [data]);
  const chartEmpty = chart.length === 0 || chart.every((p) => !Number(p.amount));
  const chartTotal = chart.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const transactions = data?.transactions ?? [];
  const deliveries = data?.deliveries ?? { today: 0, week: 0, month: 0, total: 0 };

  return (
    <div className="min-h-full bg-app py-5 sm:py-8">
      <div className="page-container space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="eyebrow font-space text-emerald-700">Wallet</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">Earnings</h1>
            <p className="mt-1.5 text-sm text-black/55 sm:text-base">
              Delivery fees are credited to you as soon as a delivery is marked delivered.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              aria-label="Refresh earnings"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-ink/15 bg-white text-ink transition-colors hover:border-ink disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
            >
              <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            {transactions.length > 0 && (
              <button
                type="button"
                onClick={() => exportCsv(transactions)}
                className="inline-flex h-12 flex-1 shrink-0 items-center justify-center gap-2 rounded-full border-2 border-ink/15 bg-white px-5 font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 sm:flex-none"
              >
                <IconDownload className="h-4 w-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {loading && !data ? (
          <Skeleton />
        ) : error && !data ? (
          <div className="surface-card flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <IconAlertTriangle className="h-7 w-7" />
            </div>
            <p className="text-lg font-extrabold tracking-tight text-ink">Couldn&apos;t load earnings</p>
            <p className="mt-1 max-w-sm text-sm text-black/55">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-bold text-white hover:bg-ink-soft"
            >
              <IconRefresh className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : data ? (
          <>
            {error && (
              <div role="alert" className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-600/20">
                <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="min-w-0 flex-1">{error}</p>
              </div>
            )}

            {/* Total earned (hero ink card) */}
            <div className="surface-ink relative overflow-hidden p-5 sm:p-8">
              <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-28 -right-28 hidden h-80 w-80 rounded-full border-[40px] border-white/5 sm:block" />
              <div className="relative grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-lime">
                      <IconWallet className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold">Total earned</h2>
                      <p className="text-sm text-white/55">From {deliveriesWord(deliveries.total)}</p>
                    </div>
                  </div>

                  <p className="mt-6 break-all font-space text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                    {money(data.total)}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      disabled={!data.payoutsEnabled}
                      aria-disabled={!data.payoutsEnabled}
                      className="inline-flex h-14 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-white/10 px-6 text-base font-bold text-white/50 ring-1 ring-white/10 sm:w-auto"
                    >
                      <IconBuildingBank className="h-5 w-5" />
                      Withdraw
                    </button>
                    <p className="text-center font-space text-[11px] uppercase tracking-widest text-lime sm:text-left">
                      Payouts coming soon
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 sm:p-5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/55">Average per delivery</span>
                    <span className="font-space font-bold">{money(data.averagePerDelivery)}</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/55">Completed deliveries</span>
                    <span className="font-space font-bold">{deliveries.total}</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <p className="text-xs text-white/45">
                    Withdrawals to your bank aren&apos;t available yet. Your earnings are recorded and will be
                    available to withdraw once payouts launch.
                  </p>
                </div>
              </div>
            </div>

            {/* Wallet strip */}
            {wallet && !wallet.available ? (
              <div role="alert" className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-600/20">
                <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="min-w-0 flex-1">
                  Wallets need a one-time database update — run backend/database/migrations/007_wallets.sql in the
                  Supabase SQL editor
                </p>
              </div>
            ) : wallet ? (
              <div className="surface-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime text-ink">
                    <IconWallet className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="eyebrow font-space text-[10px] text-black/50 sm:text-[11px]">Available in wallet</p>
                    <p className="truncate font-space text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                      {money(wallet.balance)}
                    </p>
                  </div>
                </div>
                <p className="max-w-md text-xs text-black/55 sm:text-right sm:text-sm">
                  &ldquo;Earned&rdquo; counts a fee once you mark a delivery delivered; it moves into your wallet when the
                  buyer confirms receipt.
                </p>
              </div>
            ) : null}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-5">
              <EarningsStatCard title="Today" value={money(data.today)} subtitle={deliveriesWord(deliveries.today)} icon={IconCurrencyNaira} />
              <EarningsStatCard title="This Week" value={money(data.week)} subtitle={deliveriesWord(deliveries.week)} icon={IconCalendarWeek} />
              <EarningsStatCard title="This Month" value={money(data.month)} subtitle={deliveriesWord(deliveries.month)} icon={IconCalendarMonth} />
              <EarningsStatCard
                title="Avg. per Delivery"
                value={money(data.averagePerDelivery)}
                subtitle={`Across ${deliveriesWord(deliveries.total)}`}
                icon={IconChartBar}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
              {/* Earnings Chart */}
              <div className="surface-card min-w-0 p-4 sm:p-6 lg:col-span-3">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-ink">Last 7 days</h2>
                    <p className="text-sm text-black/50">Daily delivery earnings</p>
                  </div>
                  <span className="rounded-full bg-cream px-3 py-1.5 font-space text-sm font-bold text-ink">
                    {money(chartTotal)}
                  </span>
                </div>
                {chartEmpty ? (
                  <div className="flex h-60 flex-col items-center justify-center rounded-2xl bg-cream/60 text-center sm:h-72">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-lime text-ink">
                      <IconChartBar className="h-6 w-6" />
                    </div>
                    <p className="font-bold text-ink">No earnings this week yet</p>
                    <p className="mt-1 max-w-xs text-sm text-black/55">
                      Complete deliveries to see your daily earnings here.
                    </p>
                  </div>
                ) : (
                  <div className="-ml-2 h-60 sm:ml-0 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chart}>
                        <defs>
                          <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#C8F169" stopOpacity={0.55} />
                            <stop offset="95%" stopColor="#C8F169" stopOpacity={0.04} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="rgba(12,17,14,0.06)" />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "rgba(12,17,14,0.45)", fontSize: 11 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "rgba(12,17,14,0.45)", fontSize: 11 }}
                          width={52}
                          tickFormatter={(value: number) => moneyCompact(value)}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#0C110E", strokeOpacity: 0.15 }} />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="#0C110E"
                          strokeWidth={2.5}
                          fill="url(#earningsGradient)"
                          activeDot={{ r: 6, fill: "#C8F169", stroke: "#0C110E", strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Transactions */}
              <div className="surface-card min-w-0 overflow-hidden lg:col-span-2">
                <div className="border-b border-black/5 p-4 sm:p-6">
                  <h2 className="text-xl font-extrabold tracking-tight text-ink">Transactions</h2>
                  <p className="text-sm text-black/50">Fees credited for completed deliveries</p>
                </div>

                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center px-6 py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cream text-ink">
                      <IconPackage className="h-6 w-6" />
                    </div>
                    <p className="font-bold text-ink">No transactions yet</p>
                    <p className="mt-1 max-w-xs text-sm text-black/55">
                      Each delivery you complete will show up here with its fee.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[480px] divide-y divide-black/5 overflow-y-auto">
                    {transactions.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-cream/60 sm:px-6"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-ink">
                            <IconCurrencyNaira className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink">
                              {t.orderNumber ? `Order ${t.orderNumber}` : "Delivery"}
                            </p>
                            <p className="truncate font-space text-[11px] text-black/45">
                              {[t.store, fmtDate(t.date)].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                        </div>
                        <p className="shrink-0 font-space text-sm font-bold text-emerald-700">+{money(t.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
