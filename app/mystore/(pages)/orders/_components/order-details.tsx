"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  XCircle,
  Check,
  Loader,
  ShieldCheck,
  RefreshCw,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMoney } from "@/app/mystore/_components/currency";
import { previewSplit, walletApi } from "@/services/wallet";
import {
  actionConfig,
  formatOrderDate,
  formatOrderTime,
  getAllowedActions,
  getCustomerName,
  getInitials,
  getPaymentConfig,
  getStatusConfig,
  type Order,
  type OrderAction,
} from "./orders-table";

interface OrderDetailsProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onAction: (order: Order, action: OrderAction) => void;
  busy?: boolean;
}

interface TimelineEvent {
  key: string;
  label: string;
  at: string;
  description?: string;
  tone?: "default" | "danger";
}

const statusSteps = [
  { key: "pending", label: "Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: Check },
  { key: "processing", label: "Process", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

const stepIndex: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  completed: 4,
};

const escrowLabel: Record<string, string> = {
  held: "Held in escrow",
  pending: "Awaiting payment",
  released: "Released to you",
  refunded: "Refunded to buyer",
  disputed: "Disputed",
};

const statusEventLabel: Record<string, string> = {
  confirmed: "Order confirmed",
  processing: "Processing started",
  shipped: "Order shipped",
  delivered: "Order delivered",
  completed: "Order completed",
  cancelled: "Order cancelled",
  refunded: "Order refunded",
};

const isValidDate = (iso: string | null | undefined): iso is string =>
  !!iso && !Number.isNaN(new Date(iso).getTime());

/** Timeline built only from real timestamps on the order. */
function buildTimeline(order: Order): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  if (isValidDate(order.createdAt)) {
    events.push({ key: "placed", label: "Order placed", at: order.createdAt });
  }
  const escrow = order.escrow;
  if (escrow && isValidDate(escrow.heldAt)) {
    events.push({
      key: "held",
      label: "Payment secured",
      at: escrow.heldAt,
      description: "Funds are held in escrow until the buyer confirms delivery",
    });
  }
  if (escrow && isValidDate(escrow.releasedAt)) {
    events.push({
      key: "released",
      label: "Escrow released",
      at: escrow.releasedAt,
      description: "Funds were released to your wallet",
    });
  }
  if (escrow && isValidDate(escrow.refundedAt)) {
    events.push({
      key: "refunded-escrow",
      label: "Escrow refunded",
      at: escrow.refundedAt,
      description: "Funds were returned to the buyer",
      tone: "danger",
    });
  }
  const delivery = order.delivery;
  if (delivery && isValidDate(delivery.pickedUpAt)) {
    events.push({
      key: "courier-pickup",
      label: "Picked up by courier",
      at: delivery.pickedUpAt,
      description: delivery.courier?.name ? `Courier: ${delivery.courier.name}` : undefined,
    });
  }
  if (delivery && isValidDate(delivery.deliveredAt)) {
    events.push({ key: "courier-delivered", label: "Delivered by courier", at: delivery.deliveredAt });
  }
  // The latest status change is the only one we have a timestamp for.
  const statusLabel = statusEventLabel[order.status];
  if (
    statusLabel &&
    isValidDate(order.updatedAt) &&
    order.updatedAt !== order.createdAt
  ) {
    events.push({
      key: `status-${order.status}`,
      label: statusLabel,
      at: order.updatedAt,
      description:
        order.status === "shipped" && order.trackingNumber
          ? `Tracking: ${order.trackingNumber}`
          : undefined,
      tone: order.status === "cancelled" || order.status === "refunded" ? "danger" : "default",
    });
  }
  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

const deliveryStatusLabel: Record<string, { label: string; cls: string }> = {
  pending: { label: "Looking for a courier", cls: "bg-amber-50 text-amber-700" },
  assigned: { label: "Courier assigned", cls: "bg-sky-50 text-sky-700" },
  picked_up: { label: "Picked up", cls: "bg-ink text-lime" },
  in_transit: { label: "On the way", cls: "bg-ink text-lime" },
  delivered: { label: "Delivered", cls: "bg-lime text-ink" },
  failed: { label: "Delivery failed", cls: "bg-red-50 text-red-700" },
};

const nextStepHint: Record<string, string> = {
  shipped: "Waiting for the buyer to confirm delivery. Escrow is released after confirmation.",
  delivered: "Delivered. Escrow will be released once the order is completed.",
  completed: "This order is complete.",
  cancelled: "This order was cancelled.",
  refunded: "This order was refunded to the buyer.",
};

const OrderDetails = ({ order, open, onClose, onAction, busy = false }: OrderDetailsProps) => {
  const { format } = useMoney();
  const [copied, setCopied] = useState<string | null>(null);
  const [commissionRate, setCommissionRate] = useState(5);

  // Use the platform's live commission rate for the payout preview (falls back to 5%)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    walletApi
      .get()
      .then((w: { commissionRate?: number } | null) => {
        const rate = Number(w?.commissionRate);
        if (!cancelled && Number.isFinite(rate)) setCommissionRate(rate);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!order) return null;

  const copyToClipboard = (key: string, text: string) => {
    void navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const statusConfig = getStatusConfig(order.status);
  const paymentConfig = getPaymentConfig(order.paymentStatus);
  const name = getCustomerName(order);
  const email = order.customer?.email || null;
  const phone = order.customer?.phone || order.shipping?.phone || null;
  const isClosed = order.status === "cancelled" || order.status === "refunded";
  const currentStep = stepIndex[order.status] ?? -1;
  const progress = currentStep >= 0 ? ((currentStep + 1) / statusSteps.length) * 100 : 0;
  const timeline = buildTimeline(order);
  const hasCourier = !!order.delivery;
  const payout = previewSplit({
    subtotal: Number(order.subtotal) || 0,
    total: Number(order.total) || 0,
    courierFee: hasCourier ? Number(order.shippingFee) || 0 : 0,
    commissionRate,
  });
  const actions = getAllowedActions(order);
  const forwardActions = actions.filter((a) => a !== "cancelled");
  const canCancel = actions.includes("cancelled");
  const itemCount = order.items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);

  const shipping = order.shipping;
  const addressLine = shipping
    ? [shipping.address, shipping.city, shipping.state, shipping.zip, shipping.country]
        .map((p) => p?.trim())
        .filter(Boolean)
        .join(", ")
    : "";

  const mailto = email
    ? `mailto:${email}?subject=${encodeURIComponent(`Your order ${order.orderNumber}`)}`
    : null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto border-l-0 bg-cream p-0 font-mont scrollbar-hide sm:max-w-xl">
        <SheetHeader className="space-y-1 bg-ink px-5 py-5 pr-12 text-white sm:px-6 [&~button]:text-white">
          <p className="eyebrow font-space text-[11px] text-lime">Order details</p>
          <div className="flex items-center gap-2">
            <SheetTitle className="font-space text-xl font-bold text-white sm:text-2xl">
              Order #{order.orderNumber}
            </SheetTitle>
            <button
              onClick={() => copyToClipboard("number", order.orderNumber)}
              className="rounded-full p-1.5 text-white/50 transition-colors hover:bg-lime hover:text-ink"
              aria-label="Copy order ID"
            >
              {copied === "number" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <SheetDescription className="font-space text-xs text-white/55">
            Placed {formatOrderDate(order.createdAt)} at {formatOrderTime(order.createdAt)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-4 sm:p-6">
          {/* Order Status Progress */}
          <div className="surface-card p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="eyebrow font-space text-[11px] text-black/45">Order Status</h3>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusConfig.bgColor} ${statusConfig.textColor}`}
              >
                <statusConfig.icon className="h-3.5 w-3.5" />
                {statusConfig.label}
              </span>
            </div>

            {isClosed ? (
              <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-600/10">
                {order.status === "refunded" ? (
                  <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <div>
                  <p className="font-semibold">{nextStepHint[order.status]}</p>
                  {isValidDate(order.updatedAt) && (
                    <p className="mt-0.5 font-space text-[11px] text-red-700/70">
                      {formatOrderDate(order.updatedAt)} · {formatOrderTime(order.updatedAt)}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="relative mb-6">
                  <div className="h-2 rounded-full bg-cream">
                    <div
                      className="h-2 rounded-full bg-ink transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1 sm:gap-2">
                  {statusSteps.map((step, index) => {
                    const isCompleted = index <= currentStep;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex flex-col items-center">
                        <div
                          className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                            isCompleted ? "bg-ink text-lime" : "bg-cream text-black/40"
                          }`}
                        >
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <span
                          className={`text-center text-[11px] font-medium sm:text-xs ${
                            isCompleted ? "text-ink" : "text-black/40"
                          }`}
                        >
                          {step.key === "delivered" && order.status === "completed"
                            ? "Completed"
                            : step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {nextStepHint[order.status] && (
                  <p className="mt-4 rounded-2xl bg-cream/70 px-4 py-3 text-xs text-black/60">
                    {nextStepHint[order.status]}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Customer Information */}
          <div className="surface-card p-4 sm:p-5">
            <h3 className="eyebrow mb-4 font-space text-[11px] text-black/45">Customer Details</h3>
            <div className="flex items-start gap-3 sm:gap-4">
              <Avatar className="h-11 w-11 shrink-0 sm:h-12 sm:w-12">
                {order.customer?.avatar && <AvatarImage src={order.customer.avatar} />}
                <AvatarFallback className="bg-ink font-bold text-lime">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-semibold text-ink">{name}</p>
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2 text-sm text-black/60 hover:text-ink"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-black/40" />
                    <span className="truncate">{email}</span>
                  </a>
                )}
                {phone && (
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="flex items-center gap-2 text-sm text-black/60 hover:text-ink"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-black/40" />
                    <span>{phone}</span>
                  </a>
                )}
                {!email && !phone && (
                  <p className="text-sm text-black/45">No contact details on file</p>
                )}
              </div>
            </div>
            {mailto && (
              <div className="mt-4">
                <Button
                  asChild
                  variant="outline"
                  className="h-11 w-full rounded-full border-2 border-ink/15 font-bold text-ink shadow-none hover:border-ink hover:bg-transparent"
                >
                  <a href={mailto}>
                    <MessageCircle className="h-4 w-4" />
                    Contact Customer
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Escro Courier */}
          {order.delivery && (() => {
            const delivery = order.delivery;
            const ds = deliveryStatusLabel[delivery.status] ?? deliveryStatusLabel.pending;
            const courierActive = !!delivery.courier && delivery.status !== "pending";
            return (
              <div className="surface-card p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="eyebrow font-space text-[11px] text-black/45">Courier</h3>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${ds.cls}`}>
                    <Truck className="h-3.5 w-3.5" />
                    {ds.label}
                  </span>
                </div>
                {courierActive && delivery.courier ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-ink">
                      {delivery.courier.name}
                      {delivery.courier.vehicle && (
                        <span className="font-normal capitalize text-black/50">
                          {" "}· {delivery.courier.vehicle.replace(/_/g, " ")}
                        </span>
                      )}
                    </p>
                    {delivery.courier.phone && (
                      <a
                        href={`tel:${delivery.courier.phone.replace(/\s+/g, "")}`}
                        className="flex items-center gap-2 text-black/60 hover:text-ink"
                      >
                        <Phone className="h-4 w-4 shrink-0 text-black/40" />
                        <span>{delivery.courier.phone}</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-black/55">
                    {delivery.status === "pending"
                      ? "Waiting for an Escro courier to accept this delivery."
                      : "No courier details available."}
                  </p>
                )}
                {courierActive && (
                  <p className="mt-4 rounded-2xl bg-cream/70 px-4 py-3 text-xs text-black/60">
                    An Escro courier is handling this order — its status updates automatically on pickup and
                    delivery, so manual shipping and cancellation are disabled.
                  </p>
                )}
              </div>
            );
          })()}

          {/* Order Items */}
          <div className="surface-card p-4 sm:p-5">
            <h3 className="eyebrow mb-4 font-space text-[11px] text-black/45">
              Ordered Items ({itemCount})
            </h3>
            {order.items.length === 0 ? (
              <p className="text-sm text-black/45">No items on this order.</p>
            ) : (
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cream ring-1 ring-black/5 sm:h-16 sm:w-16">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-black/35" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                        {item.sku && <p className="text-xs text-black/55">SKU: {item.sku}</p>}
                        <p className="font-space text-xs text-black/55">
                          {format(item.price)} each
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="whitespace-nowrap font-space font-bold text-ink">
                          {format(item.total ?? item.price * item.quantity)}
                        </p>
                        <p className="text-xs text-black/55">x{item.quantity}</p>
                      </div>
                    </div>
                    {index < order.items.length - 1 && <Separator className="mt-4 bg-cream" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="surface-card p-4 sm:p-5">
            <h3 className="eyebrow mb-4 font-space text-[11px] text-black/45">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-black/55">Subtotal</span>
                <span className="font-space text-ink">{format(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/55">Shipping</span>
                <span className="font-space text-ink">{format(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/55">Tax</span>
                <span className="font-space text-ink">{format(order.tax)}</span>
              </div>
              <Separator className="my-2 bg-cream" />
              <div className="flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-base font-bold">
                <span className="text-white">Total</span>
                <span className="font-space text-lime">{format(order.total)}</span>
              </div>
            </div>

            {/* Your payout */}
            <div className="mt-4 border-t border-black/5 pt-4">
              <h4 className="eyebrow mb-3 font-space text-[11px] text-black/45">Your payout</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-black/55">Escro fee ({commissionRate}%)</span>
                  <span className="font-space text-red-600">−{format(payout.commission)}</span>
                </div>
                {hasCourier && (
                  <div className="flex justify-between gap-3">
                    <span className="text-black/55">
                      Courier delivery
                      <span className="block text-xs text-black/40">Minus courier delivery fee</span>
                    </span>
                    <span className="font-space text-red-600">−{format(payout.courier)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-2xl bg-lime/40 px-4 py-3 font-bold">
                  <span className="text-ink">You receive</span>
                  <span className="font-space text-ink">{format(payout.store)}</span>
                </div>
                <p className="text-xs text-black/50">
                  Paid to your Escro wallet when the buyer confirms delivery.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 border-t border-black/5 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-black/55">Payment Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${paymentConfig.bgColor} ${paymentConfig.textColor}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${paymentConfig.dotColor}`} />
                  {paymentConfig.label}
                </span>
              </div>
              {order.escrow && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-black/55">Escrow</span>
                    <span className="inline-flex items-center gap-1.5 text-right text-ink">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      {escrowLabel[order.escrow.status ?? ""] ??
                        (order.escrow.status
                          ? order.escrow.status.charAt(0).toUpperCase() + order.escrow.status.slice(1)
                          : "—")}
                    </span>
                  </div>
                  {order.escrow.amount != null && (
                    <div className="flex justify-between">
                      <span className="text-black/55">Escrow amount</span>
                      <span className="font-space text-ink">{format(order.escrow.amount)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Shipping Information */}
          <div className="surface-card p-4 sm:p-5">
            <h3 className="eyebrow mb-4 font-space text-[11px] text-black/45">
              Shipping Information
            </h3>
            <div className="space-y-3 text-sm">
              {(shipping?.name || addressLine) ? (
                <div className="flex items-start gap-2 text-black/60">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-black/40" />
                  <div className="min-w-0">
                    {shipping?.name && <p className="font-semibold text-ink">{shipping.name}</p>}
                    {addressLine && <p>{addressLine}</p>}
                    {shipping?.phone && <p className="font-space text-xs">{shipping.phone}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-black/45">No shipping address on this order.</p>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-black/55">Tracking Number</span>
                {order.trackingNumber ? (
                  <div className="flex min-w-0 items-center gap-1">
                    <span className="truncate rounded-full bg-lime/40 px-2 py-0.5 font-space font-bold text-ink">
                      {order.trackingNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard("tracking", order.trackingNumber ?? "")}
                      className="rounded-full p-1.5 text-black/40 transition-colors hover:bg-lime hover:text-ink"
                      aria-label="Copy tracking number"
                    >
                      {copied === "tracking" ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-black/45">Not added yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes?.trim() && (
            <div className="surface-card p-4 sm:p-5">
              <h3 className="eyebrow mb-3 font-space text-[11px] text-black/45">Order Notes</h3>
              <p className="whitespace-pre-line text-sm text-black/70">{order.notes}</p>
            </div>
          )}

          {/* Order Timeline */}
          <div className="surface-card p-4 sm:p-5">
            <h3 className="eyebrow mb-4 font-space text-[11px] text-black/45">Order Timeline</h3>
            {timeline.length === 0 ? (
              <p className="text-sm text-black/45">No activity recorded yet.</p>
            ) : (
              <div className="space-y-0">
                {timeline.map((event, index) => (
                  <div key={event.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-3 w-3 shrink-0 rounded-full ${
                          event.tone === "danger" ? "bg-red-500 ring-4 ring-red-100" : "bg-ink ring-4 ring-lime"
                        }`}
                      />
                      {index < timeline.length - 1 && (
                        <div className="h-full min-h-[40px] w-0.5 bg-ink/25" />
                      )}
                    </div>
                    <div className="pb-5">
                      <p className="text-sm font-medium text-ink">{event.label}</p>
                      <p className="font-space text-[11px] text-black/50">
                        {formatOrderDate(event.at)} - {formatOrderTime(event.at)}
                      </p>
                      {event.description && (
                        <p className="mt-1 text-xs text-black/55">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {actions.length > 0 && (
            <div className="space-y-2 pt-1">
              {forwardActions.map((action, i) => {
                const cfg = actionConfig[action];
                const Icon = cfg.icon;
                return (
                  <Button
                    key={action}
                    disabled={busy}
                    onClick={() => onAction(order, action)}
                    variant={i === 0 ? "default" : "outline"}
                    className={
                      i === 0
                        ? "h-12 w-full rounded-full bg-ink font-bold text-white hover:bg-ink-soft"
                        : "h-11 w-full rounded-full border-2 border-ink/15 bg-white font-bold text-ink shadow-none hover:border-ink hover:bg-white"
                    }
                  >
                    {busy && i === 0 ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    {cfg.label}
                  </Button>
                );
              })}
              {canCancel && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => onAction(order, "cancelled")}
                  className="h-11 w-full rounded-full border-2 border-red-200 bg-white font-bold text-red-600 shadow-none hover:border-red-500 hover:bg-red-50 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Order
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default OrderDetails;
