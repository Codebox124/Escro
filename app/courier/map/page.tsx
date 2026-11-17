"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconMap,
  IconNavigation,
  IconPackage,
  IconRefresh,
} from "@/components/icons";
import { courierApi } from "@/services/courier";
import DeliveryCard, { type CourierDelivery } from "./_components/delivery-card";
import type { DeliveryPoint } from "./_components/delivery-map";

// Dynamic import for map to avoid SSR issues
const DeliveryMap = dynamic(() => import("./_components/delivery-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[240px] w-full items-center justify-center rounded-3xl bg-ink-soft">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-lime border-t-transparent" />
        <span className="font-space text-xs uppercase tracking-widest text-white/60">Loading map...</span>
      </div>
    </div>
  ),
});

// Deliveries have no coordinates yet, so the map shows no pins (centered on Lagos).
const NO_PINS: DeliveryPoint[] = [];

const errMessage = (e: unknown, fallback: string) =>
  (e as { message?: string })?.message || fallback;

function ListSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-3xl bg-white p-4 ring-1 ring-black/5">
          <div className="h-4 w-24 rounded-full bg-cream-dark" />
          <div className="mt-3 h-5 w-40 rounded-full bg-cream-dark" />
          <div className="mt-4 h-28 rounded-2xl bg-cream" />
          <div className="mt-2 h-28 rounded-2xl bg-cream" />
        </div>
      ))}
    </div>
  );
}

const MapPage = () => {
  const [deliveries, setDeliveries] = useState<CourierDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await courierApi.deliveries("active")) as { deliveries?: CourierDelivery[] };
      setDeliveries(res?.deliveries ?? []);
      setLoaded(true);
    } catch (e) {
      setError(errMessage(e, "Couldn't load your active deliveries."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex min-h-[calc(100dvh-69px)] flex-col bg-app lg:h-[calc(100dvh-69px)] lg:min-h-0">
      {/* Header */}
      <div className="px-4 pb-2 pt-5 sm:px-6 sm:pt-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="eyebrow font-space text-emerald-700">Live route</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">Delivery Map</h1>
            <p className="mt-1.5 text-sm text-black/55 sm:text-base">
              Your active deliveries with turn-by-turn directions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-full border-2 border-ink/15 bg-white px-4 font-semibold text-ink transition-colors hover:border-ink disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 md:self-auto"
          >
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:flex-row lg:overflow-hidden">
        {/* Deliveries Panel (primary) */}
        <div className="surface-card order-1 flex w-full flex-col overflow-hidden lg:order-2 lg:min-h-0 lg:w-[420px] lg:shrink-0">
          <div className="flex items-center justify-between gap-2 border-b border-black/5 px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-ink">Active deliveries</h2>
              <p className="font-space text-[11px] uppercase tracking-widest text-black/45">
                {loaded ? `${deliveries.length} ${deliveries.length === 1 ? "delivery" : "deliveries"}` : "Loading…"}
              </p>
            </div>
            <Link
              href="/courier/mydeliveries"
              className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-ink transition-colors hover:bg-cream"
            >
              Update status
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex items-start gap-2 border-b border-black/5 bg-cream/60 px-4 py-3 text-xs text-black/60 sm:px-5">
            <IconNavigation className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
            <p>Live map pins coming soon — use Navigate for turn-by-turn directions.</p>
          </div>

          <div className="flex-1 space-y-4 p-3 sm:p-4 lg:min-h-0 lg:overflow-y-auto">
            {error && (
              <div role="alert" className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-600/15">
                <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => void load()}
                    className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-bold text-red-700 ring-1 ring-red-600/20 hover:ring-red-600/40"
                  >
                    <IconRefresh className="h-3.5 w-3.5" />
                    Try again
                  </button>
                </div>
              </div>
            )}

            {loading && !loaded ? (
              <ListSkeleton />
            ) : loaded && deliveries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-lime">
                  <IconPackage className="h-7 w-7 text-ink" />
                </div>
                <p className="text-lg font-extrabold tracking-tight text-ink">No active deliveries</p>
                <p className="mt-1 max-w-xs text-sm text-black/55">
                  Accept a job and it will show up here with directions to the pickup and drop-off.
                </p>
                <Link
                  href="/courier/deliveries"
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white hover:bg-ink-soft"
                >
                  Find jobs
                  <IconArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              deliveries.map((delivery) => <DeliveryCard key={delivery.id} delivery={delivery} />)
            )}
          </div>
        </div>

        {/* Map (reference only, no pins yet) */}
        <div className="relative order-2 h-[40dvh] min-h-[260px] w-full shrink-0 overflow-hidden rounded-3xl bg-ink-soft ring-1 ring-black/5 lg:order-1 lg:h-auto lg:min-h-0 lg:flex-1 lg:shrink">
          <DeliveryMap deliveries={NO_PINS} showRoute={false} />
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex max-w-[calc(100%-5rem)] items-center gap-2 rounded-full bg-ink/90 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
            <IconMap className="h-4 w-4 shrink-0 text-lime" />
            <span className="truncate">Live pins coming soon</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
