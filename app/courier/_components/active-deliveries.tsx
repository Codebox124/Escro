"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconPhone,
  IconNavigation,
  IconPackage,
  IconArrowUpRight,
  IconArrowRight,
  IconTruck,
  IconCheck,
  IconAlertCircle,
  IconBuildingStore,
  IconMessage,
  IconRoute,
} from "@/components/icons";
import { formatMoney } from "@/lib/money";
import {
  api,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Shimmer,
  errorMessage,
  formatKm,
  formatMinutes,
  itemsSummary,
  mapsUrl,
  orderLabel,
  statusColors,
  statusLabels,
  type Delivery,
} from "./courier-shared";

const ghostPill =
  "inline-flex h-11 items-center gap-1.5 rounded-full border-2 border-ink/15 bg-white px-4 text-xs font-semibold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60";
const navPill =
  "inline-flex h-11 items-center gap-1.5 rounded-full bg-cream px-4 text-xs font-semibold text-ink transition-colors hover:bg-cream-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60";
const primaryBtn =
  "group inline-flex h-12 items-center justify-between gap-3 rounded-full bg-ink pl-5 pr-2 text-sm font-bold text-white transition-colors hover:bg-ink-soft disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 sm:flex-1";
const secondaryBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-ink/15 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-ink disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60";
const dangerBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-red-200 bg-white px-5 text-sm font-semibold text-red-700 transition-colors hover:border-red-500 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300";

type Action = "picked_up" | "in_transit" | "delivered" | "failed" | "release";

const confirmCopy: Partial<
  Record<Action, { title: string; description: string; label: string; tone: "ink" | "danger" | "lime" }>
> = {
  delivered: {
    title: "Mark as delivered?",
    description:
      "Confirm you've handed the package to the customer. The delivery fee will be credited to your earnings.",
    label: "Yes, delivered",
    tone: "lime",
  },
  failed: {
    title: "Report failed delivery?",
    description:
      "Use this only if the package couldn't be delivered (customer unreachable, wrong address, refused). This can't be undone.",
    label: "Report failed",
    tone: "danger",
  },
  release: {
    title: "Release this job?",
    description:
      "The job goes back to the open job board for another courier. You can only release jobs you haven't picked up yet.",
    label: "Release job",
    tone: "danger",
  },
};

interface CardProps {
  delivery: Delivery;
  /** Delivery changed but is still active. */
  onUpdated: (d: Delivery) => void;
  /** Delivery left the active list (delivered, failed or released). */
  onRemoved: (id: string, reason: "delivered" | "failed" | "released") => void;
}

export function DeliveryCard({ delivery, onUpdated, onRemoved }: CardProps) {
  const [busy, setBusy] = useState<Action | null>(null);
  const [confirm, setConfirm] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: Action) => {
    setBusy(action);
    setError(null);
    try {
      if (action === "release") {
        await api.release(delivery.id);
        setConfirm(null);
        onRemoved(delivery.id, "released");
        return;
      }
      const updated = await api.updateStatus(delivery.id, action);
      setConfirm(null);
      if (updated?.status === "delivered" || updated?.status === "failed") {
        onRemoved(delivery.id, updated.status);
      } else if (updated) {
        onUpdated(updated);
      }
    } catch (err) {
      setConfirm(null);
      setError(errorMessage(err, "Couldn't update this delivery"));
    } finally {
      setBusy(null);
    }
  };

  const request = (action: Action) => {
    if (confirmCopy[action]) setConfirm(action);
    else void run(action);
  };

  const { pickup, dropoff, status } = delivery;
  const navTarget =
    status === "assigned"
      ? pickup.address
      : dropoff.address || dropoff.area;
  const navLabel = status === "assigned" ? "Navigate to pickup" : "Navigate to drop-off";
  const dialog = confirm ? confirmCopy[confirm] : null;

  return (
    <article className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-1 pt-4 sm:px-6 sm:pt-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="font-space text-sm font-bold text-ink">{orderLabel(delivery)}</span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
          {delivery.distanceKm != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 font-space text-[11px] font-bold text-ink">
              <IconRoute className="h-3.5 w-3.5" />
              Trip ~{formatKm(Number(delivery.distanceKm))}
              {delivery.estimatedMinutes != null
                ? ` · ~${formatMinutes(Number(delivery.estimatedMinutes))}`
                : ""}
            </span>
          )}
        </div>
        <span className="rounded-full bg-ink px-3 py-1 font-space text-sm font-bold text-lime">
          {formatMoney(delivery.fee, "ngn")}
        </span>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        {/* Route */}
        <ol className="relative">
          <span
            aria-hidden
            className="absolute bottom-6 left-[15px] top-6 w-0.5 bg-[repeating-linear-gradient(to_bottom,rgb(12_17_14/0.25)_0_6px,transparent_6px_12px)]"
          />
          <li className="relative flex items-start gap-3 pb-5">
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-ink">
              {pickup.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pickup.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <IconBuildingStore className="h-4 w-4 text-ink" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="eyebrow font-space text-[10px] text-black/45">Pickup</p>
              <p className="mt-0.5 break-words text-[15px] font-bold text-ink">{pickup.name}</p>
              {pickup.address && pickup.address !== pickup.name && (
                <p className="break-words text-sm text-black/55">{pickup.address}</p>
              )}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {pickup.phone && (
                  <a href={`tel:${pickup.phone}`} className={ghostPill}>
                    <IconPhone className="h-3.5 w-3.5" />
                    Call store
                  </a>
                )}
                {pickup.address && (
                  <a href={mapsUrl(pickup.address)} target="_blank" rel="noopener noreferrer" className={navPill}>
                    <IconNavigation className="h-3.5 w-3.5" />
                    Navigate
                  </a>
                )}
              </div>
            </div>
          </li>

          <li className="relative flex items-start gap-3">
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime ring-2 ring-ink">
              <IconArrowUpRight className="h-4 w-4 text-ink" stroke={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="eyebrow font-space text-[10px] text-black/45">
                Drop-off{dropoff.area ? ` · ${dropoff.area}` : ""}
              </p>
              <p className="mt-0.5 break-words text-[15px] font-bold text-ink">
                {dropoff.name || "Customer"}
              </p>
              {dropoff.address && (
                <p className="break-words text-sm text-black/55">{dropoff.address}</p>
              )}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {dropoff.phone && (
                  <a href={`tel:${dropoff.phone}`} className={ghostPill}>
                    <IconPhone className="h-3.5 w-3.5" />
                    Call customer
                  </a>
                )}
                {(dropoff.address || dropoff.area) && (
                  <a
                    href={mapsUrl((dropoff.address || dropoff.area) as string)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={navPill}
                  >
                    <IconNavigation className="h-3.5 w-3.5" />
                    Navigate
                  </a>
                )}
              </div>
            </div>
          </li>
        </ol>

        {/* Items + notes */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 rounded-2xl bg-cream px-3 py-2.5 text-sm text-black/65">
            <IconPackage className="mt-0.5 h-4 w-4 shrink-0 text-black/40" />
            <span className="min-w-0 break-words">{itemsSummary(delivery)}</span>
          </div>
          {delivery.order.notes && (
            <div className="flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900 ring-1 ring-amber-200">
              <IconMessage className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">
                <span className="font-semibold">Note: </span>
                {delivery.order.notes}
              </span>
            </div>
          )}
        </div>

        {error && <ErrorState message={error} compact />}

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-black/5 pt-4 sm:flex-row sm:flex-wrap sm:gap-3">
          {status === "assigned" && (
            <>
              <button type="button" disabled={!!busy} onClick={() => request("picked_up")} className={primaryBtn}>
                <span className="flex-1 text-left">{busy === "picked_up" ? "Confirming…" : "Confirm pickup"}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink">
                  <IconPackage className="h-4 w-4" />
                </span>
              </button>
              <button type="button" disabled={!!busy} onClick={() => request("release")} className={secondaryBtn}>
                Release job
              </button>
            </>
          )}
          {status === "picked_up" && (
            <>
              <button type="button" disabled={!!busy} onClick={() => request("in_transit")} className={primaryBtn}>
                <span className="flex-1 text-left">{busy === "in_transit" ? "Starting…" : "Start trip"}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink">
                  <IconTruck className="h-4 w-4" />
                </span>
              </button>
              <button type="button" disabled={!!busy} onClick={() => request("delivered")} className={secondaryBtn}>
                <IconCheck className="h-4 w-4" />
                Mark delivered
              </button>
            </>
          )}
          {status === "in_transit" && (
            <>
              <button type="button" disabled={!!busy} onClick={() => request("delivered")} className={primaryBtn}>
                <span className="flex-1 text-left">Mark delivered</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink">
                  <IconCheck className="h-4 w-4" />
                </span>
              </button>
              <button type="button" disabled={!!busy} onClick={() => request("failed")} className={dangerBtn}>
                <IconAlertCircle className="h-4 w-4" />
                Report failed delivery
              </button>
            </>
          )}
          {navTarget && (
            <a href={mapsUrl(navTarget)} target="_blank" rel="noopener noreferrer" className={secondaryBtn}>
              <IconNavigation className="h-4 w-4" />
              {navLabel}
            </a>
          )}
        </div>
      </div>

      {dialog && confirm && (
        <ConfirmDialog
          open
          title={dialog.title}
          description={dialog.description}
          confirmLabel={dialog.label}
          tone={dialog.tone}
          busy={busy === confirm}
          onConfirm={() => void run(confirm)}
          onOpenChange={(o) => !o && setConfirm(null)}
        />
      )}
    </article>
  );
}

export function DeliveryCardSkeleton() {
  return (
    <div className="space-y-4 rounded-3xl bg-white p-4 ring-1 ring-black/5 sm:p-6">
      <div className="flex items-center justify-between">
        <Shimmer className="h-6 w-40" />
        <Shimmer className="h-7 w-20 rounded-full" />
      </div>
      <Shimmer className="h-16 w-full" />
      <Shimmer className="h-16 w-full" />
      <Shimmer className="h-10 w-full" />
      <Shimmer className="h-12 w-full rounded-full" />
    </div>
  );
}

interface ActiveDeliveriesProps {
  deliveries: Delivery[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onUpdated: (d: Delivery) => void;
  onRemoved: (id: string, reason: "delivered" | "failed" | "released") => void;
  /** Hide the section heading (e.g. when the page already has one). */
  hideHeader?: boolean;
}

const ActiveDeliveries = ({
  deliveries,
  loading,
  error,
  onRetry,
  onUpdated,
  onRemoved,
  hideHeader = false,
}: ActiveDeliveriesProps) => {
  return (
    <section className="space-y-4">
      {!hideHeader && (
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow font-space text-emerald-700">On the road</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl">
              Your active deliveries
            </h2>
          </div>
          {!loading && deliveries.length > 0 && (
            <span className="shrink-0 rounded-full bg-ink px-3 py-1.5 font-space text-xs font-bold text-lime">
              {deliveries.length} LIVE
            </span>
          )}
        </div>
      )}

      {error && !loading ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : loading && deliveries.length === 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <DeliveryCardSkeleton />
          <DeliveryCardSkeleton />
        </div>
      ) : deliveries.length === 0 ? (
        <EmptyState
          icon={IconTruck}
          title="No active deliveries"
          body="Accept a job from the job board and it will show up here."
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
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {deliveries.map((d) => (
            <DeliveryCard key={d.id} delivery={d} onUpdated={onUpdated} onRemoved={onRemoved} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ActiveDeliveries;
