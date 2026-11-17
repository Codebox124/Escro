"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  IconPackage,
  IconRoute,
  IconCircleCheck,
  IconWallet,
  IconArrowRight,
  IconPower,
} from "@/components/icons";
import { formatMoney } from "@/lib/money";
import StatCard from "./_components/stat-card";
import ActiveDeliveries from "./_components/active-deliveries";
import {
  api,
  ErrorState,
  Shimmer,
  errorMessage,
  setAvailability,
  syncAvailability,
  useCourier,
  type CourierDashboard,
  type Delivery,
} from "./_components/courier-shared";

export default function Page() {
  const { profile, isAvailable, saving } = useCourier();

  const [stats, setStats] = useState<CourierDashboard | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [active, setActive] = useState<Delivery[]>([]);
  const [activeLoading, setActiveLoading] = useState(true);
  const [activeError, setActiveError] = useState<string | null>(null);

  const [toggleError, setToggleError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await api.dashboard();
      setStats(data);
      if (typeof data?.isAvailable === "boolean") syncAvailability(data.isAvailable);
    } catch (err) {
      setStatsError(errorMessage(err, "Couldn't load your dashboard"));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadActive = useCallback(async () => {
    setActiveLoading(true);
    setActiveError(null);
    try {
      const data = await api.deliveries("active");
      setActive(data?.deliveries ?? []);
    } catch (err) {
      setActiveError(errorMessage(err, "Couldn't load your active deliveries"));
    } finally {
      setActiveLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
    void loadActive();
  }, [loadStats, loadActive]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  const handleUpdated = (d: Delivery) =>
    setActive((prev) => prev.map((x) => (x.id === d.id ? d : x)));

  const handleRemoved = (id: string, reason: "delivered" | "failed" | "released") => {
    setActive((prev) => prev.filter((x) => x.id !== id));
    setFlash(
      reason === "delivered"
        ? "Delivery completed — nice work!"
        : reason === "failed"
        ? "Delivery reported as failed."
        : "Job released back to the job board."
    );
    void loadStats();
  };

  const goOnline = async () => {
    setToggleError(null);
    try {
      await setAvailability(true);
      void loadStats();
    } catch (err) {
      setToggleError(errorMessage(err, "Couldn't go online"));
    }
  };

  const firstName = profile?.name?.trim().split(/\s+/)[0];
  const completedDiff = stats ? stats.completedToday - stats.completedYesterday : 0;

  return (
    <div className="min-h-full bg-app py-5 sm:py-8">
      <div className="page-container space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow font-space text-emerald-700">Courier overview</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-black/55 sm:text-base">
              {firstName ? `Welcome back, ${firstName}! ` : "Welcome back! "}
              Here&apos;s your delivery overview for today.
            </p>
          </div>
          <Link
            href="/courier/deliveries"
            className="group inline-flex h-12 w-full items-center justify-between gap-3 rounded-full bg-ink pl-5 pr-2 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
          >
            Find jobs
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink transition-transform group-hover:translate-x-0.5">
              <IconArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        {/* Offline banner */}
        {isAvailable === false && (
          <div className="flex flex-col gap-3 rounded-3xl bg-ink p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70">
                <IconPower className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-bold">You&apos;re offline — go online to get new jobs</p>
                <p className="text-sm text-white/55">
                  You can still finish deliveries you&apos;ve already accepted.
                </p>
                {toggleError && (
                  <p role="alert" className="mt-1 text-sm font-medium text-red-300">
                    {toggleError}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={goOnline}
              disabled={saving}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-ink hover:bg-lime-dark disabled:opacity-60"
            >
              <IconPower className="h-4 w-4" />
              {saving ? "Going online…" : "Go online"}
            </button>
          </div>
        )}

        {flash && (
          <div
            role="status"
            className="rounded-2xl bg-lime px-4 py-3 text-sm font-semibold text-ink"
          >
            {flash}
          </div>
        )}

        {/* Stats Grid */}
        {statsError && !stats ? (
          <ErrorState message={statsError} onRetry={loadStats} />
        ) : !stats ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="surface-card space-y-4 p-4 sm:p-5">
                <div className="flex justify-between">
                  <Shimmer className="h-4 w-20" />
                  <Shimmer className="h-10 w-10 rounded-xl" />
                </div>
                <Shimmer className="h-8 w-24" />
                <Shimmer className="h-4 w-28" />
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`grid grid-cols-2 gap-3 transition-opacity sm:gap-4 lg:grid-cols-4 lg:gap-5 ${
              statsLoading ? "opacity-70" : ""
            }`}
          >
            <StatCard
              title="Available jobs"
              value={stats.availableJobs}
              subtitle={stats.availableJobs === 1 ? "Open job right now" : "Open jobs right now"}
              icon={IconPackage}
              color="blue"
              notificationDot={stats.availableJobs > 0 && isAvailable !== false}
              action={{ label: "View jobs", href: "/courier/deliveries" }}
            />
            <StatCard
              title="Active deliveries"
              value={stats.activeDeliveries}
              subtitle={stats.activeDeliveries > 0 ? "In progress" : "Nothing in progress"}
              icon={IconRoute}
              color="amber"
              pulsing={stats.activeDeliveries > 0}
              action={{ label: "My deliveries", href: "/courier/mydeliveries" }}
            />
            <StatCard
              title="Completed today"
              value={stats.completedToday}
              subtitle={`Yesterday: ${stats.completedYesterday}`}
              icon={IconCircleCheck}
              color="emerald"
              trend={{
                value:
                  completedDiff === 0
                    ? "Same as yesterday"
                    : `${completedDiff > 0 ? "+" : ""}${completedDiff} vs yesterday`,
                isPositive: completedDiff > 0,
                neutral: completedDiff === 0,
              }}
            />
            <StatCard
              title="Today's earnings"
              value={formatMoney(stats.earningsToday, "ngn")}
              subtitle={`Yesterday: ${formatMoney(stats.earningsYesterday, "ngn")}`}
              icon={IconWallet}
              color="purple"
              tone="ink"
              action={{ label: "Earnings", href: "/courier/earnings" }}
            />
          </div>
        )}

        {/* Active Deliveries Section */}
        <ActiveDeliveries
          deliveries={active}
          loading={activeLoading}
          error={activeError}
          onRetry={loadActive}
          onUpdated={handleUpdated}
          onRemoved={handleRemoved}
        />
      </div>
    </div>
  );
}
