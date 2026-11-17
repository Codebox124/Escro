"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconSearch,
  IconTruck,
  IconCircleCheck,
  IconAlertCircle,
  IconRefresh,
  IconPackage,
  IconArrowRight,
  IconBuildingStore,
} from "@/components/icons";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";
import ActiveDeliveries from "../_components/active-deliveries";
import {
  ACTIVE_STATUSES,
  api,
  EmptyState,
  ErrorState,
  Shimmer,
  errorMessage,
  formatDateTime,
  orderLabel,
  statusColors,
  statusLabels,
  type Delivery,
} from "../_components/courier-shared";

type Scope = "active" | "completed" | "all";

interface ScopeState {
  items: Delivery[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
}

const emptyScope: ScopeState = { items: [], loading: false, error: null, loaded: false };

const tabs: { id: Scope; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
];

function matches(d: Delivery, q: string) {
  if (!q) return true;
  const hay = [
    d.order.orderNumber,
    d.id,
    d.pickup.name,
    d.dropoff.area,
    d.dropoff.name,
    d.dropoff.address,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="surface-card space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <Shimmer className="h-6 w-36" />
            <Shimmer className="h-5 w-24" />
          </div>
          <Shimmer className="h-10 w-full" />
          <div className="grid grid-cols-3 gap-2">
            <Shimmer className="h-14" />
            <Shimmer className="h-14" />
            <Shimmer className="h-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CompletedCard({ d }: { d: Delivery }) {
  const delivered = d.status === "delivered";
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusColors[d.status]}`}
          >
            {delivered ? (
              <IconCircleCheck className="h-3.5 w-3.5" />
            ) : (
              <IconAlertCircle className="h-3.5 w-3.5" />
            )}
            {statusLabels[d.status]}
          </span>
          <span className="font-space text-sm font-bold text-ink">{orderLabel(d)}</span>
        </div>
        <span className="font-space text-[11px] text-black/45">
          {formatDateTime(d.deliveredAt || d.updatedAt)}
        </span>
      </div>
      <div className="p-4 sm:p-6">
        <div className="mb-4">
          <p className="font-space text-[10px] uppercase tracking-widest text-black/45">Route</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 font-bold text-ink">
            <span className="inline-flex min-w-0 items-center gap-1.5 break-words">
              <IconBuildingStore className="h-4 w-4 shrink-0 text-black/40" />
              {d.pickup.name}
            </span>
            <span className="h-px w-5 bg-ink/30" />
            <span className="rounded-full bg-lime px-2 py-0.5 text-sm">
              {d.dropoff.area || "Customer"}
            </span>
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
          <div className="rounded-2xl bg-ink px-3 py-2.5">
            <p className="font-space text-[10px] uppercase tracking-widest text-white/50">
              {delivered ? "Earned" : "Fee"}
            </p>
            <p
              className={`truncate font-space text-base font-bold sm:text-lg ${
                delivered ? "text-lime" : "text-white/50 line-through"
              }`}
            >
              {formatMoney(d.fee, "ngn")}
            </p>
          </div>
          <div className="rounded-2xl bg-cream px-3 py-2.5">
            <p className="font-space text-[10px] uppercase tracking-widest text-black/45">
              Picked up
            </p>
            <p className="truncate font-space text-sm font-bold text-ink">
              {formatDateTime(d.pickedUpAt)}
            </p>
          </div>
          <div className="rounded-2xl bg-cream px-3 py-2.5">
            <p className="font-space text-[10px] uppercase tracking-widest text-black/45">
              {delivered ? "Delivered" : "Closed"}
            </p>
            <p className="truncate font-space text-sm font-bold text-ink">
              {formatDateTime(delivered ? d.deliveredAt : d.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AllRow({ d }: { d: Delivery }) {
  const isActive = ACTIVE_STATUSES.includes(d.status);
  return (
    <div className="p-4 transition-colors hover:bg-cream/60 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isActive ? "bg-ink" : "bg-cream"
            }`}
          >
            {isActive ? (
              <IconTruck className="h-5 w-5 text-lime" />
            ) : d.status === "delivered" ? (
              <IconCircleCheck className="h-5 w-5 text-emerald-700" />
            ) : (
              <IconAlertCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-space text-sm font-bold text-ink">{orderLabel(d)}</p>
            <p className="truncate text-sm text-black/55">
              {d.pickup.name}
              {d.dropoff.area ? ` → ${d.dropoff.area}` : ""}
            </p>
            <p className="font-space text-[11px] text-black/40">
              {formatDateTime(d.deliveredAt || d.updatedAt)}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusColors[d.status]}`}>
            {statusLabels[d.status]}
          </span>
          <span className="font-space text-sm font-bold text-ink">{formatMoney(d.fee, "ngn")}</span>
        </div>
      </div>
    </div>
  );
}

export default function MyDeliveriesPage() {
  const [tab, setTab] = useState<Scope>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [data, setData] = useState<Record<Scope, ScopeState>>({
    active: { ...emptyScope, loading: true },
    completed: emptyScope,
    all: emptyScope,
  });

  const patch = (scope: Scope, p: Partial<ScopeState>) =>
    setData((prev) => ({ ...prev, [scope]: { ...prev[scope], ...p } }));

  const load = useCallback(async (scope: Scope) => {
    patch(scope, { loading: true, error: null });
    try {
      const res = await api.deliveries(scope);
      patch(scope, { items: res?.deliveries ?? [], loaded: true, loading: false });
    } catch (err) {
      patch(scope, {
        loading: false,
        error: errorMessage(err, "Couldn't load your deliveries"),
      });
    }
  }, []);

  // Load the selected tab the first time it's opened.
  const current = data[tab];
  useEffect(() => {
    if (!current.loaded && !current.error) {
      void load(tab);
    }
    // Only re-run when switching tabs or after a cache invalidation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, current.loaded, load]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  const handleUpdated = (d: Delivery) => {
    setData((prev) => ({
      ...prev,
      active: { ...prev.active, items: prev.active.items.map((x) => (x.id === d.id ? d : x)) },
      all: { ...prev.all, items: prev.all.items.map((x) => (x.id === d.id ? d : x)) },
    }));
  };

  const handleRemoved = (id: string, reason: "delivered" | "failed" | "released") => {
    setData((prev) => ({
      active: { ...prev.active, items: prev.active.items.filter((x) => x.id !== id) },
      // Other tabs are now stale — refetch next time they're opened.
      completed: { ...emptyScope },
      all: { ...emptyScope },
    }));
    setFlash(
      reason === "delivered"
        ? "Delivery completed — the fee has been added to your earnings."
        : reason === "failed"
        ? "Delivery reported as failed."
        : "Job released back to the job board."
    );
  };

  const q = searchQuery.trim().toLowerCase();
  const filtered = useMemo(() => current.items.filter((d) => matches(d, q)), [current.items, q]);

  const completedStats = useMemo(() => {
    if (tab !== "completed") return null;
    const delivered = current.items.filter((d) => d.status === "delivered");
    return {
      delivered: delivered.length,
      failed: current.items.length - delivered.length,
      earned: delivered.reduce((n, d) => n + (Number(d.fee) || 0), 0),
    };
  }, [tab, current.items]);

  return (
    <div className="min-h-full bg-app py-5 sm:py-8">
      <div className="page-container space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="eyebrow font-space text-emerald-700">Assignments</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
              My Deliveries
            </h1>
            <p className="mt-1.5 text-sm text-black/55 sm:text-base">
              Track and manage your delivery assignments.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load(tab)}
            disabled={current.loading}
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-full border-2 border-ink/15 bg-white px-4 text-sm font-semibold text-ink hover:border-ink disabled:opacity-60 md:self-auto"
          >
            <IconRefresh className={`h-4 w-4 ${current.loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex min-w-max gap-1 rounded-full bg-white p-1 ring-1 ring-black/5">
            {tabs.map((t) => {
              const s = data[t.id];
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
                    tab === t.id ? "bg-ink text-white" : "text-black/55 hover:bg-cream hover:text-ink"
                  }`}
                >
                  {t.label}
                  {s.loaded && (
                    <span
                      className={`rounded-full px-2 py-0.5 font-space text-[11px] font-bold ${
                        tab === t.id ? "bg-lime text-ink" : "bg-cream text-black/60"
                      }`}
                    >
                      {s.items.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {flash && (
          <div role="status" className="rounded-2xl bg-lime px-4 py-3 text-sm font-semibold text-ink">
            {flash}
          </div>
        )}

        {/* Active Tab */}
        {tab === "active" && (
          <ActiveDeliveries
            hideHeader
            deliveries={data.active.items}
            loading={data.active.loading && !data.active.loaded}
            error={data.active.error}
            onRetry={() => void load("active")}
            onUpdated={handleUpdated}
            onRemoved={handleRemoved}
          />
        )}

        {/* Completed / All */}
        {tab !== "active" && (
          <div className="space-y-6">
            {completedStats && current.loaded && current.items.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="surface-ink p-4 sm:p-5">
                  <p className="truncate font-space text-xl font-bold text-lime sm:text-3xl">
                    {formatMoney(completedStats.earned, "ngn", { compact: true })}
                  </p>
                  <p className="mt-1 text-xs text-white/55 sm:text-sm">Earned</p>
                </div>
                <div className="surface-card p-4 sm:p-5">
                  <p className="font-space text-xl font-bold text-emerald-700 sm:text-3xl">
                    {completedStats.delivered}
                  </p>
                  <p className="mt-1 text-xs text-black/50 sm:text-sm">Delivered</p>
                </div>
                <div className="surface-card p-4 sm:p-5">
                  <p className="font-space text-xl font-bold text-ink sm:text-3xl">
                    {completedStats.failed}
                  </p>
                  <p className="mt-1 text-xs text-black/50 sm:text-sm">Failed</p>
                </div>
              </div>
            )}

            {current.loaded && current.items.length > 0 && (
              <div className="relative">
                <IconSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                <Input
                  placeholder="Search by order number, store or area…"
                  className="h-11 rounded-full border-0 bg-white pl-11 ring-1 ring-black/10 focus-visible:ring-2 focus-visible:ring-lime-dark/60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            {current.error && !current.loading ? (
              <ErrorState message={current.error} onRetry={() => void load(tab)} />
            ) : !current.loaded ? (
              <ListSkeleton />
            ) : current.items.length === 0 ? (
              <EmptyState
                icon={IconPackage}
                title={tab === "completed" ? "No completed deliveries yet" : "No deliveries yet"}
                body="Jobs you accept and complete will be listed here."
                action={
                  <Link
                    href="/courier/deliveries"
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white hover:bg-ink-soft"
                  >
                    Find jobs
                    <IconArrowRight className="h-4 w-4" />
                  </Link>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={IconSearch}
                title="No matches"
                body={`Nothing matches “${searchQuery.trim()}”.`}
              />
            ) : tab === "completed" ? (
              <div className="space-y-4">
                {filtered.map((d) => (
                  <CompletedCard key={d.id} d={d} />
                ))}
              </div>
            ) : (
              <div className="surface-card overflow-hidden">
                <div className="divide-y divide-black/5">
                  {filtered.map((d) => (
                    <AllRow key={d.id} d={d} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
