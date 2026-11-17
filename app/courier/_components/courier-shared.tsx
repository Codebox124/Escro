"use client";

import { useEffect, useSyncExternalStore } from "react";
import { courierApi } from "@/services/courier";
import { IconAlertCircle, IconRefresh } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ------------------------------------------------------------------ */
/* Types (mirror services/courier.js)                                  */
/* ------------------------------------------------------------------ */

export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed";

/** Map pin from the backend (migration 008). `approximate` = rounded to ~1 km (open jobs). */
export interface Coords {
  lat: number;
  lng: number;
  approximate?: boolean;
}

export interface Delivery {
  id: string;
  status: DeliveryStatus;
  fee: number;
  distanceKm: number | null;
  estimatedMinutes: number | null;
  /** Road-ish km / minutes from the courier to the pickup (when a position is known). */
  toPickupKm?: number | null;
  toPickupMinutes?: number | null;
  order: {
    id: string;
    orderNumber: string | null;
    status: string;
    total: number;
    trackingNumber: string | null;
    notes: string | null;
    itemCount: number;
    items: { name: string; quantity: number }[];
  };
  pickup: {
    name: string;
    logo: string | null;
    address: string | null;
    phone: string | null;
    /** undefined = maps migration not run; null = location not found */
    coords?: Coords | null;
  };
  dropoff: {
    name: string | null;
    phone: string | null;
    address: string | null;
    area: string | null;
    coords?: Coords | null;
  };
  pickedUpAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourierProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  vehicleType: string | null;
  licenseNumber: string | null;
  isAvailable: boolean;
  isVerified: boolean;
  rating: number | null;
  totalDeliveries: number;
  earningsTotal: number;
  memberSince: string | null;
  /** Last reported position (migration 008). */
  location?: { lat: number; lng: number; updatedAt?: string | null } | null;
}

export interface CourierDashboard {
  isAvailable: boolean;
  availableJobs: number;
  activeDeliveries: number;
  completedToday: number;
  completedYesterday: number;
  earningsToday: number;
  earningsYesterday: number;
  totalDeliveries: number;
  earningsTotal: number;
  rating: number | null;
}

/** Typed wrappers around courierApi. */
export const api = {
  me: () => courierApi.me() as Promise<CourierProfile>,
  updateMe: (data: Partial<{ isAvailable: boolean }>) =>
    courierApi.updateMe(data) as Promise<CourierProfile>,
  dashboard: () => courierApi.dashboard() as Promise<CourierDashboard>,
  jobs: (pos?: { lat: number; lng: number } | null) =>
    courierApi.jobs(pos ?? undefined) as Promise<{
      jobs: Delivery[];
      from: { lat: number; lng: number } | null;
    }>,
  updateLocation: (lat: number, lng: number) =>
    courierApi.updateLocation(lat, lng) as Promise<unknown>,
  accept: (id: string) => courierApi.accept(id) as Promise<Delivery>,
  deliveries: (scope: "active" | "completed" | "all") =>
    courierApi.deliveries(scope) as Promise<{ deliveries: Delivery[] }>,
  updateStatus: (
    id: string,
    status: "picked_up" | "in_transit" | "delivered" | "failed"
  ) => courierApi.updateStatus(id, status) as Promise<Delivery>,
  release: (id: string) => courierApi.release(id) as Promise<unknown>,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function errorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return fallback;
}

/* ------------------------------------------------------------------ */
/* Distance helpers                                                    */
/* ------------------------------------------------------------------ */

type LatLng = { lat: number; lng: number };

/** Straight-line distance in km. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rough road distance (straight line × 1.3), matching the backend. */
export function roadKm(a: LatLng, b: LatLng): number {
  return haversineKm(a, b) * 1.3;
}

/** ETA at ~20 km/h city speed (same as the backend). */
export function etaMinutes(km: number | null | undefined): number | null {
  if (km == null || !Number.isFinite(km)) return null;
  return Math.max(1, Math.round((km / 20) * 60));
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** True when an error says the maps DB migration (008_maps.sql) hasn't been run. */
export function isMapsMigrationError(err: unknown): boolean {
  return /008_maps\.sql/i.test(errorMessage(err, ""));
}

export const MAPS_MIGRATION_NOTE =
  "Map pins need a one-time database update — run backend/database/migrations/008_maps.sql in Supabase";

export const ACTIVE_STATUSES: DeliveryStatus[] = ["assigned", "picked_up", "in_transit"];

export const statusLabels: Record<DeliveryStatus, string> = {
  pending: "Open",
  assigned: "Awaiting pickup",
  picked_up: "Picked up",
  in_transit: "In transit",
  delivered: "Delivered",
  failed: "Failed",
};

export const statusColors: Record<DeliveryStatus, string> = {
  pending: "bg-cream-dark text-ink/70",
  assigned: "bg-cream-dark text-ink/80",
  picked_up: "bg-amber-100 text-amber-800",
  in_transit: "bg-sky-100 text-sky-800",
  delivered: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

export function orderLabel(d: Delivery): string {
  return d.order.orderNumber
    ? `#${d.order.orderNumber}`
    : `#${d.id.slice(0, 8).toUpperCase()}`;
}

export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export function itemsSummary(d: Delivery): string {
  const count = d.order.itemCount;
  const label = `${count} item${count === 1 ? "" : "s"}`;
  const names = d.order.items
    .map((i) => (i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name))
    .join(", ");
  return names ? `${label} · ${names}` : label;
}

export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr${h === 1 ? "" : "s"} ago`;
  const days = Math.round(h / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function initials(name: string | null | undefined): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "C";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Courier profile / availability store (shared by navbar + pages)     */
/* ------------------------------------------------------------------ */

interface CourierState {
  profile: CourierProfile | null;
  isAvailable: boolean | null; // null = not loaded yet
  loading: boolean;
  saving: boolean;
  error: string | null;
}

let state: CourierState = {
  profile: null,
  isAvailable: null,
  loading: false,
  saving: false,
  error: null,
};
const listeners = new Set<() => void>();
const SERVER_STATE = state;

function setState(patch: Partial<CourierState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

let inflight: Promise<void> | null = null;

export function loadCourierProfile(force = false): Promise<void> {
  if (inflight) return inflight;
  if (state.profile && !force) return Promise.resolve();
  setState({ loading: true, error: null });
  inflight = api
    .me()
    .then((profile) => {
      setState({ profile, isAvailable: !!profile.isAvailable, loading: false });
    })
    .catch((err) => {
      setState({ loading: false, error: errorMessage(err, "Couldn't load your profile") });
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Sync availability from another source (e.g. dashboard response). */
export function syncAvailability(isAvailable: boolean) {
  if (state.saving) return;
  if (state.isAvailable !== isAvailable) setState({ isAvailable });
}

/** Optimistic toggle; reverts and throws { message } on failure. */
export async function setAvailability(next: boolean): Promise<void> {
  const prev = state.isAvailable;
  setState({ isAvailable: next, saving: true, error: null });
  try {
    const profile = await api.updateMe({ isAvailable: next });
    setState({
      profile: profile && typeof profile === "object" ? { ...state.profile, ...profile } : state.profile,
      isAvailable: profile && typeof profile.isAvailable === "boolean" ? profile.isAvailable : next,
      saving: false,
    });
  } catch (err) {
    setState({ isAvailable: prev, saving: false });
    throw { message: errorMessage(err, "Couldn't update your status") };
  }
}

export function useCourier(): CourierState {
  const s = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  useEffect(() => {
    void loadCourierProfile();
  }, []);
  return s;
}

/* ------------------------------------------------------------------ */
/* Live location store (written by <LocationTracker />)                */
/* ------------------------------------------------------------------ */

export type LocationPermission = "unknown" | "granted" | "denied" | "unsupported";

export interface CourierLocationState {
  /** Latest browser position (only while online and allowed). */
  position: { lat: number; lng: number; accuracy: number | null; at: number } | null;
  permission: LocationPermission;
  /** Server said the maps migration (008) hasn't been run. */
  migrationNeeded: boolean;
}

let locState: CourierLocationState = {
  position: null,
  permission: "unknown",
  migrationNeeded: false,
};
const LOC_SERVER_STATE = locState;
const locListeners = new Set<() => void>();

export function setCourierLocation(patch: Partial<CourierLocationState>) {
  const next = { ...locState, ...patch };
  if (
    next.position === locState.position &&
    next.permission === locState.permission &&
    next.migrationNeeded === locState.migrationNeeded
  )
    return;
  locState = next;
  locListeners.forEach((l) => l());
}

function subscribeLocation(l: () => void) {
  locListeners.add(l);
  return () => locListeners.delete(l);
}

export function useCourierLocation(): CourierLocationState {
  return useSyncExternalStore(subscribeLocation, () => locState, () => LOC_SERVER_STATE);
}

/* ------------------------------------------------------------------ */
/* Shared UI bits                                                      */
/* ------------------------------------------------------------------ */

export function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-cream-dark/70 ${className}`} />;
}

export function ErrorState({
  message,
  onRetry,
  compact = false,
}: {
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-start gap-3 rounded-3xl bg-red-50 ring-1 ring-red-200 sm:flex-row sm:items-center ${
        compact ? "p-3" : "p-4 sm:p-5"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <IconAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <p className="min-w-0 text-sm font-medium text-red-800">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
        >
          <IconRefresh className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ElementType;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface-card flex flex-col items-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cream text-ink">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-extrabold tracking-tight text-ink">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-black/55">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "ink",
  busy = false,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "ink" | "danger" | "lime";
  busy?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const confirmCls =
    tone === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : tone === "lime"
      ? "bg-lime text-ink hover:bg-lime-dark"
      : "bg-ink text-white hover:bg-ink-soft";
  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="w-[calc(100%-1.5rem)] rounded-3xl border-0 bg-white p-5 ring-1 ring-black/5 sm:max-w-md sm:p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl font-extrabold tracking-[-0.02em] text-ink">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-black/60">{description}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            className="h-12 rounded-full border-2 border-ink/15 bg-white px-5 text-sm font-semibold text-ink hover:border-ink disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`h-12 rounded-full px-6 text-sm font-bold disabled:opacity-60 ${confirmCls}`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
