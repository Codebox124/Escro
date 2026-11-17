"use client";

import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  IconBan,
  IconCheck,
  IconChecks,
  IconCircleCheck,
  IconCircleDot,
  IconClock,
  IconCopy,
  IconEye,
  IconMessageCircle,
  IconPackage,
  IconRefresh,
  IconTruck,
  IconUxCircle,
  Loader,
  MoreHorizontal,
  type LucideIcon,
} from "@/components/icons";
import { useMoney } from "@/app/mystore/_components/currency";

// ------------------------------------------------------------
// Types (mirror the /api/seller/orders response)
// ------------------------------------------------------------

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "escrow" | "paid" | "refunded" | "pending";

export interface OrderItem {
  id: string;
  productId: string | null;
  name: string;
  sku: string | null;
  image: string | null;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  escrow: {
    status: string | null;
    amount: number | null;
    heldAt: string | null;
    releasedAt: string | null;
    refundedAt: string | null;
  } | null;
  customer: {
    id: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    avatar: string | null;
  } | null;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  shipping: {
    name: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
  } | null;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
  /** Escro courier delivery, when one exists for this order. */
  delivery?: {
    id: string;
    status: "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "failed";
    pickedUpAt: string | null;
    deliveredAt: string | null;
    courier: { name: string; phone: string | null; vehicle: string | null } | null;
  } | null;
}

export interface OrderStats {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
}

/** Status changes a seller is allowed to make (mirrors the backend). */
export type OrderAction = "confirmed" | "processing" | "shipped" | "cancelled";

export const SELLER_TRANSITIONS: Partial<Record<OrderStatus, OrderAction[]>> = {
  pending: ["confirmed", "processing", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
};

export const getAllowedActions = (order: Order): OrderAction[] =>
  SELLER_TRANSITIONS[order.status] ?? [];

export const actionConfig: Record<
  OrderAction,
  { label: string; icon: LucideIcon; danger?: boolean }
> = {
  confirmed: { label: "Confirm order", icon: IconCheck },
  processing: { label: "Start processing", icon: IconCircleDot },
  shipped: { label: "Mark as shipped", icon: IconTruck },
  cancelled: { label: "Cancel order", icon: IconUxCircle, danger: true },
};

// ------------------------------------------------------------
// Display helpers
// ------------------------------------------------------------

const toDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatOrderDate = (iso: string | null | undefined) => {
  const d = toDate(iso);
  return d
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
};

export const formatOrderTime = (iso: string | null | undefined) => {
  const d = toDate(iso);
  return d ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
};

export const getCustomerName = (order: Order) =>
  order.customer?.name?.trim() || order.shipping?.name?.trim() || "Customer";

export const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "?";

export const getItemCount = (order: Order) =>
  (order.items ?? []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

type PillConfig = { label: string; bgColor: string; textColor: string };

export const paymentStatusConfig: Record<string, PillConfig & { dotColor: string }> = {
  paid: {
    label: "Paid",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-700",
    dotColor: "bg-emerald-500",
  },
  escrow: {
    label: "Escrow",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
    dotColor: "bg-amber-500",
  },
  pending: {
    label: "Pending",
    bgColor: "bg-cream-dark",
    textColor: "text-black/70",
    dotColor: "bg-black/35",
  },
  refunded: {
    label: "Refunded",
    bgColor: "bg-cream-dark",
    textColor: "text-black/60",
    dotColor: "bg-black/35",
  },
};

export const getPaymentConfig = (status: string | null | undefined) =>
  paymentStatusConfig[status ?? ""] ?? {
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
    bgColor: "bg-cream-dark",
    textColor: "text-black/60",
    dotColor: "bg-black/35",
  };

export const orderStatusConfig: Record<OrderStatus, PillConfig & { icon: LucideIcon }> = {
  pending: {
    label: "Pending",
    bgColor: "bg-cream-dark",
    textColor: "text-black/70",
    icon: IconClock,
  },
  confirmed: {
    label: "Confirmed",
    bgColor: "bg-violet-100",
    textColor: "text-violet-700",
    icon: IconCheck,
  },
  processing: {
    label: "Processing",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
    icon: IconCircleDot,
  },
  shipped: {
    label: "Shipped",
    bgColor: "bg-sky-100",
    textColor: "text-sky-700",
    icon: IconPackage,
  },
  delivered: {
    label: "Delivered",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-700",
    icon: IconChecks,
  },
  completed: {
    label: "Completed",
    bgColor: "bg-lime",
    textColor: "text-ink",
    icon: IconCircleCheck,
  },
  cancelled: {
    label: "Cancelled",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    icon: IconBan,
  },
  refunded: {
    label: "Refunded",
    bgColor: "bg-orange-100",
    textColor: "text-orange-700",
    icon: IconRefresh,
  },
};

export const getStatusConfig = (status: string) =>
  orderStatusConfig[status as OrderStatus] ?? {
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
    bgColor: "bg-cream-dark",
    textColor: "text-black/70",
    icon: IconClock,
  };

// ------------------------------------------------------------
// Table
// ------------------------------------------------------------

interface OrdersTableProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onAction: (order: Order, action: OrderAction) => void;
  busyId?: string | null;
}

const menuClass =
  "w-56 rounded-3xl border-black/5 p-2 font-mont shadow-xl shadow-black/10 [&_[role=menuitem]]:rounded-full [&_[role=menuitem]]:px-3 [&_[role=menuitem]]:py-2";

const ItemThumbs = ({ order }: { order: Order }) => {
  const withImages = (order.items ?? []).filter((i) => i.image).slice(0, 3);
  if (withImages.length === 0) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cream ring-1 ring-black/5">
        <IconPackage className="h-4 w-4 text-black/35" />
      </div>
    );
  }
  return (
    <div className="flex shrink-0 -space-x-2">
      {withImages.map((item) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={item.id}
          src={item.image ?? ""}
          alt={item.name}
          className="h-8 w-8 rounded-xl bg-cream object-cover ring-2 ring-white"
        />
      ))}
    </div>
  );
};

const OrderActionsMenu = ({
  order,
  onViewDetails,
  onAction,
  busy,
}: {
  order: Order;
  onViewDetails: (order: Order) => void;
  onAction: (order: Order, action: OrderAction) => void;
  busy: boolean;
}) => {
  const actions = getAllowedActions(order);
  const forward = actions.filter((a) => a !== "cancelled");
  const canCancel = actions.includes("cancelled");
  const email = order.customer?.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 rounded-full p-0 text-black/55 hover:bg-ink hover:text-white"
          aria-label="Order actions"
          disabled={busy}
          onClick={(e) => e.stopPropagation()}
        >
          {busy ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={menuClass}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem onSelect={() => onViewDetails(order)}>
          <IconEye className="mr-2 h-4 w-4" />
          View details
        </DropdownMenuItem>
        {email && (
          <DropdownMenuItem asChild>
            <a href={`mailto:${email}?subject=${encodeURIComponent(`Your order ${order.orderNumber}`)}`}>
              <IconMessageCircle className="mr-2 h-4 w-4" />
              Contact customer
            </a>
          </DropdownMenuItem>
        )}
        {forward.length > 0 && <DropdownMenuSeparator />}
        {forward.map((action) => {
          const cfg = actionConfig[action];
          const Icon = cfg.icon;
          return (
            <DropdownMenuItem key={action} onSelect={() => onAction(order, action)}>
              <Icon className="mr-2 h-4 w-4" />
              {cfg.label}
            </DropdownMenuItem>
          );
        })}
        {canCancel && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-700"
              onSelect={() => onAction(order, "cancelled")}
            >
              <IconUxCircle className="mr-2 h-4 w-4" />
              {actionConfig.cancelled.label}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const OrdersTable = ({ orders, onViewDetails, onAction, busyId }: OrdersTableProps) => {
  const { format } = useMoney();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyOrderNumber = (order: Order) => {
    void navigator.clipboard?.writeText(order.orderNumber).catch(() => {});
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const th =
    "px-5 py-4 text-left font-space text-[11px] font-normal uppercase tracking-widest text-black/45";

  return (
    <TooltipProvider>
      <div className="surface-card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden overflow-x-auto xl:block">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-black/5">
              <tr>
                <th className={th}>Order ID</th>
                <th className={th}>Date</th>
                <th className={th}>Customer</th>
                <th className={th}>Items</th>
                <th className={th}>Total</th>
                <th className={th}>Payment</th>
                <th className={th}>Status</th>
                <th className={th}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {orders.map((order) => {
                const paymentConfig = getPaymentConfig(order.paymentStatus);
                const statusConfig = getStatusConfig(order.status);
                const StatusIcon = statusConfig.icon;
                const name = getCustomerName(order);
                const count = getItemCount(order);

                return (
                  <tr
                    key={order.id}
                    className="cursor-pointer transition-colors hover:bg-cream/60"
                    onClick={() => onViewDetails(order)}
                  >
                    {/* Order ID */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap font-space text-sm font-bold text-ink">
                          #{order.orderNumber}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyOrderNumber(order);
                              }}
                              className="rounded-full p-1.5 text-black/40 transition-colors hover:bg-lime hover:text-ink"
                              aria-label="Copy order ID"
                            >
                              <IconCopy className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {copiedId === order.id ? "Copied!" : "Copy ID"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5">
                      <p className="whitespace-nowrap font-space text-[13px] text-ink">
                        {formatOrderDate(order.createdAt)}
                      </p>
                      <p className="whitespace-nowrap font-space text-[11px] text-black/40">
                        {formatOrderTime(order.createdAt)}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {order.customer?.avatar && (
                            <AvatarImage src={order.customer.avatar} />
                          )}
                          <AvatarFallback className="bg-ink text-xs font-medium text-lime">
                            {getInitials(name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="max-w-[180px] truncate text-sm font-semibold text-ink">
                            {name}
                          </p>
                          {order.customer?.email && (
                            <p className="max-w-[180px] truncate text-[11px] text-black/45">
                              {order.customer.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Items */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <ItemThumbs order={order} />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help whitespace-nowrap text-sm text-black/60 underline decoration-black/20 decoration-dotted underline-offset-4">
                              {count} item{count === 1 ? "" : "s"}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            {order.items.length > 0 ? (
                              <ul className="space-y-1 text-xs">
                                {order.items.map((item) => (
                                  <li key={item.id}>
                                    {item.name} × {item.quantity}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-xs">No items</span>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-5 py-3.5">
                      <span className="whitespace-nowrap font-space text-sm font-bold text-ink">
                        {format(order.total)}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${paymentConfig.bgColor} ${paymentConfig.textColor}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${paymentConfig.dotColor}`} />
                        {paymentConfig.label}
                      </span>
                    </td>

                    {/* Order Status */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusConfig.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <OrderActionsMenu
                        order={order}
                        onViewDetails={onViewDetails}
                        onAction={onAction}
                        busy={busyId === order.id}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-black/5 xl:hidden">
          {orders.map((order) => {
            const paymentConfig = getPaymentConfig(order.paymentStatus);
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            const name = getCustomerName(order);
            const count = getItemCount(order);
            const names = order.items.map((i) => i.name).join(", ");

            return (
              <div
                key={order.id}
                className="cursor-pointer p-4 transition-colors hover:bg-cream/60 active:bg-cream sm:p-5"
                onClick={() => onViewDetails(order)}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-space text-sm font-bold text-ink">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig.label}
                    </span>
                  </div>
                  <OrderActionsMenu
                    order={order}
                    onViewDetails={onViewDetails}
                    onAction={onAction}
                    busy={busyId === order.id}
                  />
                </div>

                <div className="mb-3 flex min-w-0 items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {order.customer?.avatar && <AvatarImage src={order.customer.avatar} />}
                    <AvatarFallback className="bg-ink text-xs font-bold text-lime">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{name}</p>
                    <p className="truncate text-xs text-black/55">
                      {count} item{count === 1 ? "" : "s"}
                      {names ? ` · ${names}` : ""}
                    </p>
                  </div>
                  <ItemThumbs order={order} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-space text-base font-bold text-ink">
                      {format(order.total)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${paymentConfig.bgColor} ${paymentConfig.textColor}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${paymentConfig.dotColor}`} />
                      {paymentConfig.label}
                    </span>
                  </div>
                  <p className="text-right font-space text-[11px] text-black/40">
                    {formatOrderDate(order.createdAt)} · {formatOrderTime(order.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default OrdersTable;
