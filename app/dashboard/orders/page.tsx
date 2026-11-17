"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  CheckCircle2,
  IconAlertTriangle,
  IconCheck,
  IconChecks,
  IconChevronDown,
  IconClock,
  IconMap,
  IconMapPin,
  IconNavigation,
  IconPackage,
  IconPhone,
  IconRefresh,
  IconSearch,
  IconShieldCheck,
  IconShoppingBag,
  IconTruck,
  IconWallet,
  IconX,
  Loader2,
  ShieldAlert,
  Store,
} from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buyerService } from "@/services/shop";
import { formatMoney } from "@/lib/money";
import { useCart } from "../_components/cart-context";
import type { MiniMapMarker } from "@/components/ui/mini-map";

const MiniMap = dynamic(() => import("@/components/ui/mini-map"), {
  ssr: false,
  loading: () => <div className="h-56 w-full animate-pulse rounded-2xl bg-cream sm:h-64" />,
});

// ---------------------------------------------------------------- types

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

type EscrowStatus = "held" | "released" | "refunded" | "disputed";

type DeliveryStatus = "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "failed";

type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  store: { id: string; name: string; slug: string; logo: string | null } | null;
  items: {
    id: string;
    productId: string | null;
    name: string;
    image: string | null;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  shipping: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string | null;
    country: string;
  } | null;
  trackingNumber: string | null;
  notes: string | null;
  escrow: {
    status: EscrowStatus;
    amount: number;
    heldAt: string | null;
    releasedAt: string | null;
    refundedAt: string | null;
  } | null;
  dispute: { id: string; reason: string; details: string | null; status: string; createdAt: string } | null;
  can: { confirm: boolean; cancel: boolean; dispute: boolean };
  delivery?: {
    id: string;
    status: DeliveryStatus;
    pickedUpAt: string | null;
    deliveredAt: string | null;
    courier: { name: string; phone: string | null; vehicle: string | null } | null;
    /** absent until migration 008 runs */
    map?: {
      pickup: LatLng | null;
      dropoff: LatLng | null;
      courier: (LatLng & { updatedAt: string | null }) | null;
      distanceKm: number | null;
      etaMinutes: number | null;
    } | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type LatLng = { lat: number; lng: number };

type Stats = { total: number; active: number; completed: number; cancelled: number; inEscrow: number };

type DialogState = { type: "confirm" | "cancel" | "dispute"; order: Order } | null;

// ---------------------------------------------------------------- config

const STATUS: Record<OrderStatus, { label: string; cls: string; icon: React.ElementType }> = {
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 ring-amber-600/20", icon: IconClock },
  confirmed: { label: "Confirmed", cls: "bg-sky-50 text-sky-700 ring-sky-600/20", icon: IconCheck },
  processing: { label: "Processing", cls: "bg-cream-dark text-ink ring-black/10", icon: IconPackage },
  shipped: { label: "Shipped", cls: "bg-ink text-lime ring-ink", icon: IconTruck },
  delivered: { label: "Delivered", cls: "bg-lime text-ink ring-lime-dark/40", icon: IconCheck },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", icon: IconChecks },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-700 ring-red-600/20", icon: IconX },
  refunded: { label: "Refunded", cls: "bg-slate-100 text-slate-700 ring-slate-500/20", icon: IconRefresh },
};

const ESCROW: Record<EscrowStatus, { label: string; cls: string; icon: React.ElementType }> = {
  held: { label: "Held in escrow", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", icon: IconShieldCheck },
  released: { label: "Paid to seller", cls: "bg-cream text-black/60 ring-black/10", icon: IconWallet },
  refunded: { label: "Refunded to you", cls: "bg-sky-50 text-sky-700 ring-sky-600/20", icon: IconRefresh },
  disputed: { label: "Escrow on hold · dispute", cls: "bg-red-50 text-red-700 ring-red-600/20", icon: ShieldAlert },
};

const DELIVERY: Record<DeliveryStatus, { label: string; cls: string }> = {
  pending: { label: "Looking for a courier", cls: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  assigned: { label: "Courier assigned", cls: "bg-sky-50 text-sky-700 ring-sky-600/20" },
  picked_up: { label: "Picked up", cls: "bg-ink text-lime ring-ink" },
  in_transit: { label: "On the way", cls: "bg-ink text-lime ring-ink" },
  delivered: { label: "Delivered", cls: "bg-lime text-ink ring-lime-dark/40" },
  failed: { label: "Delivery failed", cls: "bg-red-50 text-red-700 ring-red-600/20" },
};

const REASONS: { value: string; label: string }[] = [
  { value: "not_received", label: "I haven't received it" },
  { value: "not_as_described", label: "Not as described" },
  { value: "damaged", label: "Arrived damaged" },
  { value: "wrong_item", label: "Wrong item sent" },
  { value: "other", label: "Something else" },
];
const reasonLabel = (r: string) => REASONS.find((x) => x.value === r)?.label || r.replace(/_/g, " ");

const MIGRATION_RE = /003_customer_flow\.sql/;
const errMessage = (e: unknown, fallback: string) =>
  (e as { message?: string })?.message || fallback;

const LIVE_DELIVERY: DeliveryStatus[] = ["picked_up", "in_transit"];

const hasMapPins = (o: Order) => {
  const m = o.delivery?.map;
  return !!(m && (m.pickup || m.dropoff || m.courier));
};

const fmtEta = (mins: number | null | undefined) => {
  if (mins == null || !Number.isFinite(Number(mins))) return null;
  const m = Math.round(Number(mins));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} hr${h === 1 ? "" : "s"}${m % 60 ? ` ${m % 60} min` : ""}`;
};

const timeAgo = (iso: string | null | undefined, now: number) => {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const mins = Math.max(0, Math.round((now - t) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  return fmtDate(iso, true);
};

const fmtDate = (iso: string | null | undefined, withTime = false) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
};

// ---------------------------------------------------------------- page

export default function OrdersPage() {
  const router = useRouter();
  const { add } = useCart();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [notices, setNotices] = useState<Record<string, { tone: "ok" | "err"; text: string }>>({});
  const [reordering, setReordering] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await buyerService.getOrders()) as { orders: Order[]; stats: Stats };
      setOrders(data?.orders || []);
      setStats(data?.stats || null);
    } catch (e) {
      setError(errMessage(e, "We couldn't load your orders."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  // Deep link from checkout success: /dashboard/orders#order-<id>
  useEffect(() => {
    if (loading || !orders.length) return;
    const m = window.location.hash.match(/^#order-(.+)$/);
    if (!m) return;
    const id = decodeURIComponent(m[1]);
    if (!orders.some((o) => o.id === id)) return;
    Promise.resolve().then(() => {
      setExpanded(id);
      requestAnimationFrame(() =>
        document.getElementById(`order-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    });
  }, [loading, orders]);

  const counts = useMemo(() => {
    const c: Partial<Record<OrderStatus, number>> = {};
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (!q) return true;
      return (
        o.orderNumber?.toLowerCase().includes(q) ||
        o.store?.name?.toLowerCase().includes(q) ||
        o.items.some((i) => i.name?.toLowerCase().includes(q))
      );
    });
  }, [orders, filter, query]);

  const replaceOrder = (updated: Order) => {
    setOrders((list) => list.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
  };

  // Quietly re-fetch one order (used by the live delivery tracker).
  const refreshOrder = useCallback(async (id: string) => {
    try {
      const updated = (await buyerService.getOrder(id)) as Order | undefined;
      if (updated?.id) setOrders((list) => list.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
    } catch {
      /* keep the last known position */
    }
  }, []);

  const afterAction = async (updated: Order | undefined, id: string, text: string) => {
    if (updated?.id) replaceOrder(updated);
    setNotices((n) => ({ ...n, [id]: { tone: "ok", text } }));
    // stats (in-escrow, active…) changed server-side — refresh them quietly
    try {
      const data = (await buyerService.getOrders()) as { orders: Order[]; stats: Stats };
      if (data?.stats) setStats(data.stats);
      if (!updated?.id && data?.orders) setOrders(data.orders);
    } catch {
      /* keep local state */
    }
  };

  const reorder = async (order: Order) => {
    const items = order.items.filter((i) => i.productId);
    if (!items.length) return;
    setReordering(order.id);
    const failed: string[] = [];
    for (const i of items) {
      try {
        await add(i.productId as string, i.quantity);
      } catch {
        failed.push(i.name);
      }
    }
    setReordering(null);
    if (failed.length === items.length) {
      setNotices((n) => ({
        ...n,
        [order.id]: { tone: "err", text: "None of these items could be added — they may be out of stock." },
      }));
      return;
    }
    if (failed.length) {
      setNotices((n) => ({
        ...n,
        [order.id]: { tone: "err", text: `Added to cart, except: ${failed.join(", ")}` },
      }));
      return;
    }
    router.push("/dashboard/cart");
  };

  const chipClass = (active: boolean) =>
    `inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full pl-4 pr-1.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
      active ? "bg-ink text-white shadow-lg shadow-black/10" : "bg-white text-ink ring-1 ring-black/5 hover:ring-ink/30"
    }`;
  const countClass = (active: boolean) =>
    `flex h-8 min-w-8 items-center justify-center rounded-full px-2 font-space text-[11px] font-bold ${
      active ? "bg-lime text-ink" : "bg-cream text-black/55"
    }`;

  return (
    <div className="page-container py-6 md:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
        <div className="min-w-0">
          <p className="eyebrow font-space text-emerald-700">Purchases</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">My orders</h1>
          <p className="mt-2 text-sm text-black/55 sm:text-base">
            Track deliveries and release escrow payments when your order arrives.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink/15 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink disabled:opacity-50"
        >
          <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading && !orders.length ? (
        <OrdersSkeleton />
      ) : orders.length === 0 ? (
        <div className="surface-card flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-lime text-ink">
            <IconPackage className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">No orders yet</h2>
          <p className="mt-2 max-w-sm text-sm text-black/55">
            When you buy something, it shows up here — with your payment safely held in escrow until you
            confirm delivery.
          </p>
          <Link
            href="/dashboard/shop"
            className="group mt-6 inline-flex h-12 items-center gap-3 rounded-full bg-ink pl-6 pr-1.5 font-semibold text-white hover:bg-ink-soft"
          >
            Start shopping
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-ink transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <div className="surface-ink col-span-2 flex items-center gap-4 p-5 lg:col-span-1">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime text-ink">
                <IconShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-white/60">In escrow now</p>
                <p className="truncate font-space text-xl font-bold tracking-tight text-lime sm:text-2xl">
                  {formatMoney(stats?.inEscrow ?? 0, "ngn")}
                </p>
              </div>
            </div>
            <StatTile label="Total orders" value={stats?.total ?? orders.length} icon={IconShoppingBag} />
            <StatTile label="Active" value={stats?.active ?? 0} icon={IconTruck} />
            <StatTile label="Completed" value={stats?.completed ?? 0} icon={IconChecks} />
          </div>

          {/* Search + filters */}
          <div className="relative mb-4">
            <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order number, store or product…"
              aria-label="Search orders"
              className="h-12 w-full rounded-full bg-white pl-11 pr-4 text-sm text-ink ring-1 ring-black/10 placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-lime-dark/60 sm:max-w-md"
            />
          </div>
          <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:mb-8 sm:flex-wrap sm:px-0">
            <button type="button" onClick={() => setFilter("all")} className={chipClass(filter === "all")}>
              All orders
              <span className={countClass(filter === "all")}>{orders.length}</span>
            </button>
            {(Object.keys(STATUS) as OrderStatus[])
              .filter((s) => counts[s] || filter === s)
              .map((s) => (
                <button key={s} type="button" onClick={() => setFilter(s)} className={chipClass(filter === s)}>
                  {STATUS[s].label}
                  <span className={countClass(filter === s)}>{counts[s] || 0}</span>
                </button>
              ))}
          </div>

          {visible.length === 0 ? (
            <div className="surface-card flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cream text-ink">
                <IconSearch className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-extrabold tracking-tight text-ink">No matching orders</h3>
              <p className="mt-1 text-sm text-black/55">Try another search or filter.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
                className="mt-4 inline-flex h-11 items-center rounded-full border-2 border-ink/15 px-5 text-sm font-semibold text-ink hover:border-ink"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {visible.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  expanded={expanded === order.id}
                  onToggle={() => setExpanded((x) => (x === order.id ? null : order.id))}
                  notice={notices[order.id]}
                  onDismissNotice={() =>
                    setNotices((n) => {
                      const next = { ...n };
                      delete next[order.id];
                      return next;
                    })
                  }
                  onAction={(type) => setDialog({ type, order })}
                  onReorder={() => reorder(order)}
                  reordering={reordering === order.id}
                  onRefresh={refreshOrder}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ActionDialog
        state={dialog}
        onClose={() => setDialog(null)}
        onDone={(updated, id, text) => {
          setDialog(null);
          afterAction(updated, id, text);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- order card

function OrderCard({
  order,
  expanded,
  onToggle,
  notice,
  onDismissNotice,
  onAction,
  onReorder,
  reordering,
  onRefresh,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  notice?: { tone: "ok" | "err"; text: string };
  onDismissNotice: () => void;
  onAction: (type: "confirm" | "cancel" | "dispute") => void;
  onReorder: () => void;
  reordering: boolean;
  onRefresh: (id: string) => Promise<void>;
}) {
  const status = STATUS[order.status] || STATUS.pending;
  const StatusIcon = status.icon;
  const escrow = order.escrow ? ESCROW[order.escrow.status] : null;
  const EscrowIcon = escrow?.icon;
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const canReorder = order.items.some((i) => i.productId);
  const canTrack = hasMapPins(order);
  const [tracking, setTracking] = useState(false);

  return (
    <article
      id={`order-${order.id}`}
      className="surface-card scroll-mt-28 overflow-hidden p-2 transition-shadow duration-300 hover:shadow-[0_24px_48px_-28px_rgba(12,17,14,0.3)]"
    >
      {/* Header */}
      <div className="rounded-2xl bg-cream p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-space text-[10px] uppercase tracking-widest text-black/45">Order</p>
            <h3 className="truncate font-space text-base font-bold tracking-tight text-ink sm:text-lg">
              {order.orderNumber}
            </h3>
            <p className="mt-0.5 font-space text-[11px] text-black/50">Placed {fmtDate(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ring-1 ${status.cls}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{status.label}</span>
            </span>
            {escrow && EscrowIcon && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ring-1 ${escrow.cls}`}>
                <EscrowIcon className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">{escrow.label}</span>
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-black/5 pt-3 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink text-lime">
              {order.store?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.store.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <Store className="h-3.5 w-3.5" />
              )}
            </span>
            <span className="truncate font-semibold text-ink">{order.store?.name || "Store"}</span>
          </span>
          {order.trackingNumber && (
            <span className="flex min-w-0 items-center gap-1.5 text-black/60">
              <IconTruck className="h-4 w-4 shrink-0" />
              Tracking
              <span className="truncate font-space font-bold text-ink">{order.trackingNumber}</span>
            </span>
          )}
        </div>
        {order.delivery && <DeliveryLine delivery={order.delivery} />}
        {canTrack && (
          <button
            type="button"
            onClick={() => setTracking((t) => !t)}
            aria-expanded={tracking}
            className={`mt-3 inline-flex h-10 items-center gap-2 rounded-full px-4 text-xs font-bold transition-colors ${
              tracking ? "bg-ink text-lime" : "bg-white text-ink ring-1 ring-black/10 hover:ring-ink"
            }`}
          >
            <IconMap className="h-4 w-4" />
            {tracking ? "Hide map" : "Track delivery"}
            {order.delivery?.map?.courier && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-dark opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-dark" />
              </span>
            )}
          </button>
        )}
      </div>

      {canTrack && tracking && order.delivery && <DeliveryTracker order={order} onRefresh={onRefresh} />}

      <div className="p-3 pt-4 sm:p-4 sm:pt-5">
        {notice && (
          <div
            role="status"
            className={`mb-4 flex items-start gap-3 rounded-2xl p-3 text-sm ring-1 ${
              notice.tone === "ok"
                ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20"
                : "bg-amber-50 text-amber-800 ring-amber-600/20"
            }`}
          >
            {notice.tone === "ok" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p className="min-w-0 flex-1">{notice.text}</p>
            <button type="button" onClick={onDismissNotice} aria-label="Dismiss" className="shrink-0">
              <IconX className="h-4 w-4" />
            </button>
          </div>
        )}

        {order.dispute && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm ring-1 ring-red-600/15">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="min-w-0">
              <p className="font-bold text-red-800">
                Problem reported · <span className="capitalize">{order.dispute.status.replace(/_/g, " ")}</span>
              </p>
              <p className="mt-0.5 text-red-700">
                {reasonLabel(order.dispute.reason)}
                {order.dispute.details ? ` — ${order.dispute.details}` : ""}
              </p>
              <p className="mt-1 font-space text-[11px] text-red-600/80">
                Opened {fmtDate(order.dispute.createdAt, true)} · payment stays in escrow until it&apos;s resolved
              </p>
            </div>
          </div>
        )}

        {/* Items */}
        <ul className="divide-y divide-black/5">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-cream sm:h-16 sm:w-16">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-black/30">
                    <IconShoppingBag className="h-6 w-6" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {item.productId ? (
                  <Link
                    href={`/dashboard/shop/${item.productId}`}
                    className="line-clamp-2 text-sm font-bold text-ink hover:underline sm:text-base"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <p className="line-clamp-2 text-sm font-bold text-ink sm:text-base">{item.name}</p>
                )}
                <p className="font-space text-[11px] text-black/50">
                  {item.quantity} × {formatMoney(item.price, "ngn")}
                </p>
              </div>
              <p className="shrink-0 font-space text-sm font-bold text-ink sm:text-base">
                {formatMoney(item.total, "ngn")}
              </p>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="mt-5 border-t border-black/5 pt-5">
          <div className="mb-4 flex items-end justify-between gap-4">
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              className="inline-flex h-11 items-center gap-1.5 rounded-full pr-2 text-sm font-semibold text-ink underline-offset-4 hover:underline"
            >
              {expanded ? "Hide details" : "Order details"}
              <IconChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
            <div className="shrink-0 text-right">
              <p className="font-space text-[10px] uppercase tracking-widest text-black/45">
                Total · {itemCount} item{itemCount === 1 ? "" : "s"}
              </p>
              <p className="font-space text-xl font-bold tracking-tight text-ink sm:text-2xl">
                {formatMoney(order.total, "ngn")}
              </p>
            </div>
          </div>

          {expanded && <OrderDetails order={order} />}

          {(order.can?.confirm || order.can?.cancel || order.can?.dispute || canReorder) && (
            <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:flex sm:flex-wrap">
              {order.can?.confirm && (
                <button
                  type="button"
                  onClick={() => onAction("confirm")}
                  className="group inline-flex h-11 items-center justify-between gap-3 rounded-full bg-ink pl-5 pr-1.5 text-sm font-semibold text-white hover:bg-ink-soft min-[400px]:col-span-2 sm:justify-start"
                >
                  Confirm delivery
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink">
                    <IconCheck className="h-4 w-4" />
                  </span>
                </button>
              )}
              {order.can?.dispute && (
                <button
                  type="button"
                  onClick={() => onAction("dispute")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-ink/15 px-5 text-sm font-semibold text-ink hover:border-ink"
                >
                  <IconAlertTriangle className="h-4 w-4" />
                  Report a problem
                </button>
              )}
              {order.can?.cancel && (
                <button
                  type="button"
                  onClick={() => onAction("cancel")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-red-200 px-5 text-sm font-semibold text-red-600 hover:border-red-500 hover:bg-red-50 hover:text-red-700"
                >
                  <IconX className="h-4 w-4" />
                  Cancel order
                </button>
              )}
              {canReorder && (
                <button
                  type="button"
                  onClick={onReorder}
                  disabled={reordering}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-ink hover:bg-lime-dark disabled:opacity-60"
                >
                  {reordering ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconRefresh className="h-4 w-4" />}
                  Buy again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function DeliveryLine({ delivery }: { delivery: NonNullable<Order["delivery"]> }) {
  const d = DELIVERY[delivery.status] || DELIVERY.pending;
  const courier = delivery.courier;
  const showCourier = courier && delivery.status !== "pending";
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-black/5 pt-3 text-sm">
      <span className="flex items-center gap-1.5 text-black/60">
        <IconTruck className="h-4 w-4 shrink-0" />
        Escro delivery
      </span>
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${d.cls}`}>
        {d.label}
      </span>
      {showCourier && (
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate font-semibold text-ink">
            {courier.name}
            {courier.vehicle ? <span className="font-normal capitalize text-black/50"> · {courier.vehicle.replace(/_/g, " ")}</span> : null}
          </span>
          {courier.phone && delivery.status !== "delivered" && (
            <a
              href={`tel:${courier.phone}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-bold text-ink ring-1 ring-black/10 hover:ring-ink"
            >
              <IconPhone className="h-3.5 w-3.5" />
              Call courier
            </a>
          )}
        </span>
      )}
    </div>
  );
}

function DeliveryTracker({ order, onRefresh }: { order: Order; onRefresh: (id: string) => Promise<void> }) {
  const delivery = order.delivery!;
  const map = delivery.map;
  const live = LIVE_DELIVERY.includes(delivery.status);
  const courierName = delivery.courier?.name || "Courier";
  const [now, setNow] = useState(() => Date.now());

  // Poll every 20s while the parcel is on its way and the tracker is open.
  useEffect(() => {
    if (!live) return;
    const id = order.id;
    const timer = window.setInterval(() => {
      onRefresh(id).finally(() => setNow(Date.now()));
    }, 20000);
    return () => window.clearInterval(timer);
  }, [live, order.id, onRefresh]);

  const pickup = map?.pickup;
  const dropoff = map?.dropoff;
  const courierPos = map?.courier;
  const markers = useMemo(() => {
    const list: MiniMapMarker[] = [];
    if (pickup) list.push({ lat: pickup.lat, lng: pickup.lng, kind: "pickup", label: order.store?.name || "Store" });
    if (courierPos) list.push({ lat: courierPos.lat, lng: courierPos.lng, kind: "courier", label: courierName });
    if (dropoff) list.push({ lat: dropoff.lat, lng: dropoff.lng, kind: "dropoff", label: "You" });
    return list;
  }, [pickup, dropoff, courierPos, order.store?.name, courierName]);

  const eta = fmtEta(map?.etaMinutes);
  const distance = map?.distanceKm != null ? `${Number(map.distanceKm).toFixed(1)} km` : null;

  return (
    <div className="px-2 pt-3 sm:px-3">
      <MiniMap markers={markers} line />
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {courierPos ? (
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 font-bold text-lime">
            <IconNavigation className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{courierName}</span>
            {courierPos.updatedAt && (
              <span className="shrink-0 font-normal text-white/60">· updated {timeAgo(courierPos.updatedAt, now)}</span>
            )}
          </span>
        ) : live ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-800 ring-1 ring-amber-600/20">
            Waiting for the courier&apos;s location…
          </span>
        ) : delivery.status !== "delivered" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 font-semibold text-black/60">
            The courier&apos;s live location shows once your order is picked up
          </span>
        ) : null}
        {distance && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 font-space font-bold text-ink">
            <IconMapPin className="h-3.5 w-3.5" />
            {distance}
          </span>
        )}
        {eta && delivery.status !== "delivered" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 font-space font-bold text-ink">
            <IconClock className="h-3.5 w-3.5" />~{eta}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-space text-[11px] text-black/50">
        {pickup && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ink" /> Store pickup
          </span>
        )}
        {dropoff && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-lime ring-1 ring-ink/20" /> Your address
          </span>
        )}
        {live && <span>Live · refreshes every 20s</span>}
      </div>
    </div>
  );
}

function OrderDetails({ order }: { order: Order }) {
  const events = useMemo(() => {
    const list: { at: string; title: string; note?: string; tone: "ink" | "lime" | "red" | "sky" }[] = [];
    if (order.createdAt) list.push({ at: order.createdAt, title: "Order placed", tone: "ink" });
    if (order.escrow?.heldAt)
      list.push({
        at: order.escrow.heldAt,
        title: "Payment held in escrow",
        note: formatMoney(order.escrow.amount, "ngn"),
        tone: "ink",
      });
    if (order.dispute?.createdAt)
      list.push({ at: order.dispute.createdAt, title: "Problem reported", note: reasonLabel(order.dispute.reason), tone: "red" });
    if (order.delivery?.pickedUpAt)
      list.push({ at: order.delivery.pickedUpAt, title: "Picked up by courier", note: order.delivery.courier?.name, tone: "ink" });
    if (order.delivery?.deliveredAt)
      list.push({ at: order.delivery.deliveredAt, title: "Delivered by courier", tone: "lime" });
    if (order.escrow?.releasedAt)
      list.push({ at: order.escrow.releasedAt, title: "Payment released to seller", tone: "lime" });
    if (order.escrow?.refundedAt)
      list.push({ at: order.escrow.refundedAt, title: "Payment refunded to you", tone: "sky" });
    list.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    const last = list[list.length - 1];
    if (order.updatedAt && (!last || new Date(order.updatedAt).getTime() - new Date(last.at).getTime() > 1000)) {
      list.push({
        at: order.updatedAt,
        title: `Status: ${(STATUS[order.status] || STATUS.pending).label}`,
        note: "Last update",
        tone: "ink",
      });
    }
    return list;
  }, [order]);

  const dot: Record<string, string> = {
    ink: "bg-ink ring-lime/40",
    lime: "bg-lime ring-lime/40",
    red: "bg-red-500 ring-red-200",
    sky: "bg-sky-500 ring-sky-200",
  };

  return (
    <div className="mb-5 grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl bg-cream p-4">
        <p className="eyebrow font-space text-black/45">Ship to</p>
        {order.shipping ? (
          <div className="mt-2 text-sm text-black/65">
            <p className="font-bold text-ink">{order.shipping.name}</p>
            <p className="mt-1 flex items-start gap-1.5">
              <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
              <span className="min-w-0 wrap-break-word">
                {order.shipping.address}, {order.shipping.city}, {order.shipping.state}
                {order.shipping.zip ? ` ${order.shipping.zip}` : ""}, {order.shipping.country}
              </span>
            </p>
            <p className="mt-1 font-space text-xs">{order.shipping.phone}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-black/50">No address on file.</p>
        )}
        {order.notes && (
          <p className="mt-3 border-t border-black/5 pt-3 text-xs text-black/55">
            <span className="font-semibold text-ink">Your note:</span> {order.notes}
          </p>
        )}
      </div>

      <div className="rounded-2xl bg-cream p-4">
        <p className="eyebrow font-space text-black/45">Payment</p>
        <dl className="mt-2 space-y-1.5 text-sm">
          {[
            ["Subtotal", formatMoney(order.subtotal, "ngn")],
            ["Shipping", order.shippingFee > 0 ? formatMoney(order.shippingFee, "ngn") : "Free"],
            ["Tax", formatMoney(order.tax, "ngn")],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-black/55">{k}</dt>
              <dd className="font-space font-bold text-ink">{v}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t border-black/5 pt-1.5">
            <dt className="font-semibold text-ink">Total</dt>
            <dd className="font-space font-bold text-ink">{formatMoney(order.total, "ngn")}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl bg-cream p-4">
        <p className="eyebrow font-space text-black/45">Timeline</p>
        <ol className="mt-3">
          {events.map((ev, i) => (
            <li key={`${ev.title}-${i}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ${dot[ev.tone]}`} />
                {i < events.length - 1 && <span className="my-1 w-0.5 flex-1 bg-black/10" />}
              </div>
              <div className="min-w-0 pb-3">
                <p className="text-sm font-semibold text-ink">{ev.title}</p>
                <p className="font-space text-[11px] text-black/50">
                  {fmtDate(ev.at, true)}
                  {ev.note ? ` · ${ev.note}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- dialogs

function ActionDialog({
  state,
  onClose,
  onDone,
}: {
  state: DialogState;
  onClose: () => void;
  onDone: (updated: Order | undefined, id: string, text: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("not_received");
  const [details, setDetails] = useState("");

  const open = !!state;
  const order = state?.order;
  const type = state?.type;

  const reset = () => {
    setBusy(false);
    setError(null);
    setReason("not_received");
    setDetails("");
  };

  const submit = async () => {
    if (!order || !type) return;
    if (type === "dispute" && details.trim().length < 10) {
      setError("Please describe the problem (at least 10 characters).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let res: unknown;
      let text = "";
      if (type === "confirm") {
        res = await buyerService.confirmDelivery(order.id);
        text = "Delivery confirmed — payment released to the seller. Thanks!";
      } else if (type === "cancel") {
        res = await buyerService.cancelOrder(order.id);
        text = "Order cancelled — your escrow payment has been refunded.";
      } else {
        res = await buyerService.openDispute(order.id, reason, details.trim());
        text = "Problem reported. Your payment stays in escrow while we look into it.";
      }
      const r = res as (Order & { order?: Order }) | undefined;
      const updated = r?.order?.id ? r.order : r?.id ? r : undefined;
      reset();
      onDone(updated, order.id, text);
    } catch (e) {
      setError(errMessage(e, "That didn't work. Please try again."));
      setBusy(false);
    }
  };

  const copy = {
    confirm: {
      title: "Confirm delivery?",
      desc: "Only confirm once you've received everything and you're happy with it.",
      cta: "Yes, release payment",
      ctaCls: "bg-ink text-white hover:bg-ink-soft",
    },
    cancel: {
      title: "Cancel this order?",
      desc: "The seller will be notified and the order can't be restored.",
      cta: "Cancel order",
      ctaCls: "bg-red-600 text-white hover:bg-red-700",
    },
    dispute: {
      title: "Report a problem",
      desc: "Tell us what went wrong. Your payment stays in escrow until the issue is resolved.",
      cta: "Submit report",
      ctaCls: "bg-ink text-white hover:bg-ink-soft",
    },
  }[type || "confirm"];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !busy) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] overflow-y-auto rounded-3xl border-0 bg-white p-6 font-mont ring-1 ring-black/5 sm:max-w-[480px]">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl font-extrabold tracking-[-0.03em] text-ink">{copy.title}</DialogTitle>
          <DialogDescription className="text-black/55">
            {order && <span className="font-space font-bold text-ink">{order.orderNumber}</span>}
            {order && " · "}
            {copy.desc}
          </DialogDescription>
        </DialogHeader>

        {order && type === "confirm" && (
          <div className="flex items-start gap-3 rounded-2xl bg-cream p-4 text-sm text-black/65">
            <IconWallet className="mt-0.5 h-5 w-5 shrink-0 text-ink" />
            <p>
              This releases{" "}
              <span className="font-space font-bold text-ink">
                {formatMoney(order.escrow?.amount ?? order.total, "ngn")}
              </span>{" "}
              from escrow to <span className="font-semibold text-ink">{order.store?.name || "the seller"}</span>. This
              can&apos;t be undone — if something&apos;s wrong, report a problem instead.
            </p>
          </div>
        )}

        {order && type === "cancel" && (
          <div className="flex items-start gap-3 rounded-2xl bg-sky-50 p-4 text-sm text-sky-900 ring-1 ring-sky-600/15">
            <IconRefresh className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              The <span className="font-space font-bold">{formatMoney(order.escrow?.amount ?? order.total, "ngn")}</span>{" "}
              held in escrow will be refunded to you.
            </p>
          </div>
        )}

        {type === "dispute" && (
          <div className="grid gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">What happened?</span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-12 w-full rounded-2xl bg-white px-4 text-sm text-ink ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-lime-dark/60"
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">Details</span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Describe the issue so the seller and Escro can resolve it…"
                className="w-full resize-y rounded-2xl bg-white px-4 py-3 text-sm text-ink ring-1 ring-black/10 placeholder:text-black/35 focus:outline-none focus:ring-2 focus:ring-lime-dark/60"
              />
            </label>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className={`rounded-2xl p-3 text-sm ring-1 ${
              MIGRATION_RE.test(error)
                ? "bg-amber-50 font-space text-amber-800 ring-amber-600/20"
                : "bg-red-50 text-red-700 ring-red-600/15"
            }`}
          >
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              reset();
              onClose();
            }}
            className="h-11 rounded-full border-2 border-ink/15 px-5 text-sm font-semibold text-ink hover:border-ink disabled:opacity-50"
          >
            Go back
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-60 ${copy.ctaCls}`}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {copy.cta}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------- misc

function StatTile({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="surface-card flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-ink sm:h-11 sm:w-11">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-black/50">{label}</p>
        <p className="font-space text-xl font-bold tracking-tight text-ink sm:text-2xl">{value}</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const migration = MIGRATION_RE.test(message);
  return (
    <div
      className={`flex flex-col items-center rounded-3xl px-6 py-14 text-center ring-1 ${
        migration ? "bg-amber-50 ring-amber-600/20" : "bg-white ring-black/5"
      }`}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
          migration ? "bg-amber-100 text-amber-700" : "bg-red-50 text-red-600"
        }`}
      >
        <IconAlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-extrabold tracking-tight text-ink">
        {migration ? "Database setup needed" : "Couldn't load your orders"}
      </h2>
      <p className={`mt-1 max-w-md wrap-break-word text-sm ${migration ? "font-space text-amber-800" : "text-black/55"}`}>
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-soft"
      >
        <IconRefresh className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div aria-busy="true">
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="col-span-2 h-[88px] animate-pulse rounded-3xl bg-ink/90 lg:col-span-1" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="surface-card h-[88px] animate-pulse" />
        ))}
      </div>
      <div className="mb-6 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-11 w-28 shrink-0 animate-pulse rounded-full bg-white" />
        ))}
      </div>
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="surface-card p-2">
            <div className="h-28 animate-pulse rounded-2xl bg-cream" />
            <div className="space-y-3 p-4">
              <div className="flex gap-4">
                <div className="h-16 w-16 animate-pulse rounded-2xl bg-black/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 animate-pulse rounded-full bg-black/5" />
                  <div className="h-3 w-1/4 animate-pulse rounded-full bg-black/5" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
