"use client";

import {
  IconBuildingStore,
  IconMapPin,
  IconNavigation,
  IconPackage,
  IconPhone,
} from "@/components/icons";
import { formatMoney } from "@/lib/money";

export type DeliveryStatus = "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "failed";

/** Shape returned by courierApi.deliveries() — see services/courier.js. */
export interface CourierDelivery {
  id: string;
  status: DeliveryStatus;
  fee: number;
  distanceKm: number | null;
  estimatedMinutes: number | null;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    trackingNumber: string | null;
    notes: string | null;
    itemCount: number;
    items: { name: string; quantity: number }[];
  } | null;
  pickup: { name: string | null; logo: string | null; address: string | null; phone: string | null } | null;
  dropoff: { name: string | null; phone: string | null; address: string | null; area: string | null } | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS: Record<DeliveryStatus, { label: string; cls: string }> = {
  pending: { label: "Open", cls: "bg-cream-dark text-ink" },
  assigned: { label: "Go to pickup", cls: "bg-amber-100 text-amber-800" },
  picked_up: { label: "Picked up", cls: "bg-ink text-lime" },
  in_transit: { label: "On the way", cls: "bg-ink text-lime" },
  delivered: { label: "Delivered", cls: "bg-lime text-ink" },
  failed: { label: "Failed", cls: "bg-red-100 text-red-700" },
};

export const directionsUrl = (address: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

const telHref = (phone: string) => `tel:${phone.replace(/\s+/g, "")}`;

function Stop({
  kind,
  title,
  address,
  phone,
  isNext,
}: {
  kind: "pickup" | "dropoff";
  title: string;
  address: string | null;
  phone: string | null;
  isNext: boolean;
}) {
  const Icon = kind === "pickup" ? IconBuildingStore : IconMapPin;
  return (
    <div className={`rounded-2xl p-3 ${isNext ? "bg-lime/40 ring-1 ring-lime-dark/40" : "bg-cream"}`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            kind === "pickup" ? "bg-ink text-lime" : "bg-lime text-ink"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-space text-[10px] uppercase tracking-widest text-black/45">
            {kind === "pickup" ? "Pickup" : "Drop-off"}
            {isNext && <span className="ml-1.5 font-bold text-ink">· Next stop</span>}
          </p>
          <p className="truncate text-sm font-bold text-ink">{title}</p>
          <p className="text-sm text-black/60">{address || "Address not available"}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {address ? (
          <a
            href={directionsUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm font-bold transition-colors ${
              isNext ? "bg-ink text-white hover:bg-ink-soft" : "border-2 border-ink/15 bg-white text-ink hover:border-ink"
            }`}
          >
            <IconNavigation className="h-4 w-4" />
            Navigate
          </a>
        ) : (
          <span className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-white/60 text-sm font-semibold text-black/40">
            No address
          </span>
        )}
        {phone && (
          <a
            href={telHref(phone)}
            aria-label={`Call ${kind === "pickup" ? "store" : "customer"}`}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink/15 bg-white text-ink transition-colors hover:border-ink"
          >
            <IconPhone className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function DeliveryCard({ delivery }: { delivery: CourierDelivery }) {
  const status = STATUS[delivery.status] || STATUS.assigned;
  const headingToDropoff = delivery.status === "picked_up" || delivery.status === "in_transit";
  const dropoffAddress =
    [delivery.dropoff?.address, delivery.dropoff?.area].filter(Boolean).join(", ") || null;
  const items = delivery.order?.items ?? [];
  const itemCount = delivery.order?.itemCount ?? items.reduce((n, i) => n + (i.quantity || 0), 0);

  return (
    <article className="rounded-3xl bg-white p-4 ring-1 ring-black/5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 font-space text-[10px] font-bold uppercase tracking-widest ${status.cls}`}>
            {status.label}
          </span>
          <h3 className="mt-1.5 truncate font-space text-base font-bold text-ink">
            {delivery.order?.orderNumber ? `Order ${delivery.order.orderNumber}` : "Delivery"}
          </h3>
          {itemCount > 0 && (
            <p className="flex items-center gap-1.5 truncate text-xs text-black/55">
              <IconPackage className="h-3.5 w-3.5 shrink-0" />
              {itemCount} item{itemCount === 1 ? "" : "s"}
              {items[0]?.name ? ` · ${items[0].name}${items.length > 1 ? ` +${items.length - 1} more` : ""}` : ""}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-space text-[10px] uppercase tracking-widest text-black/45">Fee</p>
          <p className="font-space text-base font-bold text-emerald-700">{formatMoney(delivery.fee, "ngn")}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Stop
          kind="pickup"
          title={delivery.pickup?.name || "Store"}
          address={delivery.pickup?.address ?? null}
          phone={delivery.pickup?.phone ?? null}
          isNext={!headingToDropoff}
        />
        <Stop
          kind="dropoff"
          title={delivery.dropoff?.name || "Customer"}
          address={dropoffAddress}
          phone={delivery.dropoff?.phone ?? null}
          isNext={headingToDropoff}
        />
      </div>

      {delivery.order?.notes && (
        <p className="mt-3 rounded-2xl bg-cream/70 px-3 py-2 text-xs text-black/60">
          <span className="font-semibold text-ink">Note:</span> {delivery.order.notes}
        </p>
      )}
    </article>
  );
}
