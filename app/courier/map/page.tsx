"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCurrentLocation,
  IconMap,
  IconPackage,
  IconRefresh,
  IconX,
} from "@/components/icons";
import { courierApi } from "@/services/courier";
import DeliveryCard, { type CourierDelivery, type MapCoords } from "./_components/delivery-card";
import type { DeliveryPoint, LngLat, MapFocus } from "./_components/delivery-map";
import {
  MAPS_MIGRATION_NOTE,
  etaMinutes,
  roadKm,
  useCourier,
  useCourierLocation,
} from "../_components/courier-shared";

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

const HINT_KEY = "escro:courier:location-hint-dismissed";

const errMessage = (e: unknown, fallback: string) =>
  (e as { message?: string })?.message || fallback;

const toLngLat = (c: MapCoords | null | undefined): LngLat | null =>
  c && Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lng))
    ? [Number(c.lng), Number(c.lat)]
    : null;

const headingToDropoff = (d: CourierDelivery) =>
  d.status === "picked_up" || d.status === "in_transit";

/** The stop the courier should head to next for this delivery. */
const nextStop = (d: CourierDelivery): LngLat | null =>
  headingToDropoff(d) ? toLngLat(d.dropoff?.coords) : toLngLat(d.pickup?.coords);

const deliveryCoords = (d: CourierDelivery): LngLat[] =>
  [toLngLat(d.pickup?.coords), toLngLat(d.dropoff?.coords)].filter((c): c is LngLat => !!c);

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [hintDismissed, setHintDismissed] = useState(() => {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem(HINT_KEY) === "1";
    } catch {
      return false;
    }
  });

  const { profile, isAvailable } = useCourier();
  const { position, permission, migrationNeeded } = useCourierLocation();

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

  // Live position first, then the last one saved on the server.
  const youLng = position?.lng ?? toLngLat(profile?.location ?? null)?.[0];
  const youLat = position?.lat ?? toLngLat(profile?.location ?? null)?.[1];
  const you = useMemo<LngLat | null>(
    () => (youLng != null && youLat != null ? [youLng, youLat] : null),
    [youLng, youLat]
  );

  const points = useMemo<DeliveryPoint[]>(() => {
    const list: DeliveryPoint[] = [];
    for (const d of deliveries) {
      const pickup = toLngLat(d.pickup?.coords);
      const dropoff = toLngLat(d.dropoff?.coords);
      if (pickup)
        list.push({
          id: `${d.id}:pickup`,
          groupId: d.id,
          type: "pickup",
          name: d.pickup?.name || "Store",
          address: d.pickup?.address || "",
          coordinates: pickup,
          status: headingToDropoff(d) ? "completed" : "active",
        });
      if (dropoff)
        list.push({
          id: `${d.id}:dropoff`,
          groupId: d.id,
          type: "dropoff",
          name: d.dropoff?.name || "Customer",
          address: [d.dropoff?.address, d.dropoff?.area].filter(Boolean).join(", "),
          coordinates: dropoff,
          approximate: !!d.dropoff?.coords?.approximate,
          status: "active",
        });
    }
    return list;
  }, [deliveries]);

  // Route: you → next stop of the selected delivery (or the first one with a pin).
  const route = useMemo<LngLat[] | null>(() => {
    if (!you) return null;
    const d =
      deliveries.find((x) => x.id === selectedId && nextStop(x)) ??
      deliveries.find((x) => nextStop(x));
    const target = d ? nextStop(d) : null;
    return target ? [you, target] : null;
  }, [deliveries, selectedId, you]);

  const focusOn = (coords: LngLat[]) =>
    setFocus((f) => ({ coordinates: coords, key: (f?.key ?? 0) + 1 }));

  const selectDelivery = (d: CourierDelivery) => {
    setSelectedId(d.id);
    const coords = deliveryCoords(d);
    if (you) coords.push(you);
    focusOn(coords);
  };

  const showAll = () => {
    setSelectedId(null);
    const coords = points.map((p) => p.coordinates);
    if (you) coords.push(you);
    focusOn(coords);
  };

  const dismissHint = () => {
    setHintDismissed(true);
    try {
      window.localStorage.setItem(HINT_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  // coords === undefined on every delivery means the maps migration hasn't been run.
  const pinsMissingSchema =
    deliveries.length > 0 && deliveries.every((d) => d.pickup?.coords === undefined);
  const showMigrationNote = migrationNeeded || pinsMissingSchema;
  const showLocationHint =
    !hintDismissed && (permission === "denied" || permission === "unsupported");
  const showOnlineHint = !showLocationHint && isAvailable === false && !you;

  return (
    <div className="flex min-h-[calc(100dvh-69px)] flex-col bg-app lg:h-[calc(100dvh-69px)] lg:min-h-0">
      {/* Header */}
      <div className="px-4 pb-2 pt-5 sm:px-6 sm:pt-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="eyebrow font-space text-emerald-700">Live route</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">Delivery Map</h1>
            <p className="mt-1.5 text-sm text-black/55 sm:text-base">
              Your active pickups and drop-offs, with directions to each stop.
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

      {/* Main Content: map on top (mobile), side-by-side on lg */}
      <div className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:flex-row lg:overflow-hidden">
        {/* Map */}
        <div className="relative order-1 h-[42dvh] min-h-[260px] w-full shrink-0 overflow-hidden rounded-3xl bg-ink-soft ring-1 ring-black/5 lg:h-auto lg:min-h-0 lg:flex-1 lg:shrink">
          <DeliveryMap
            deliveries={points}
            courierLocation={you}
            selectedDeliveryId={selectedId}
            onMarkerClick={(p) => {
              const d = deliveries.find((x) => x.id === p.groupId);
              if (d) selectDelivery(d);
            }}
            showRoute
            route={route}
            focus={focus}
          />

          {points.length > 0 && (
            <button
              type="button"
              onClick={showAll}
              className="absolute left-3 top-3 z-10 inline-flex h-10 items-center gap-2 rounded-full bg-ink/90 px-3.5 text-xs font-bold text-white shadow-lg backdrop-blur-md hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
            >
              <IconMap className="h-4 w-4 shrink-0 text-lime" />
              Show all
            </button>
          )}

          {(showLocationHint || showOnlineHint) && (
            <div className="absolute inset-x-3 bottom-8 z-10 flex items-start gap-2 rounded-2xl bg-white/95 p-3 text-xs text-ink shadow-lg ring-1 ring-black/5 backdrop-blur-md sm:left-auto sm:max-w-xs">
              <IconCurrentLocation className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <p className="min-w-0 flex-1">
                {showLocationHint
                  ? "Allow location to see yourself on the map and get nearest jobs."
                  : "Go online to share your live location and see yourself on the map."}
              </p>
              {showLocationHint && (
                <button
                  type="button"
                  onClick={dismissHint}
                  aria-label="Dismiss"
                  className="-m-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-black/50 hover:bg-cream hover:text-ink"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Deliveries Panel */}
        <div className="surface-card order-2 flex w-full flex-col overflow-hidden lg:min-h-0 lg:w-[420px] lg:shrink-0">
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

          {showMigrationNote && (
            <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 sm:px-5">
              <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{MAPS_MIGRATION_NOTE}</p>
            </div>
          )}

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
              deliveries.map((delivery) => {
                const target = nextStop(delivery);
                const km =
                  you && target
                    ? roadKm({ lat: you[1], lng: you[0] }, { lat: target[1], lng: target[0] })
                    : null;
                return (
                  <DeliveryCard
                    key={delivery.id}
                    delivery={delivery}
                    selected={selectedId === delivery.id}
                    onSelect={deliveryCoords(delivery).length ? () => selectDelivery(delivery) : undefined}
                    toNextKm={km}
                    toNextMinutes={etaMinutes(km)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
