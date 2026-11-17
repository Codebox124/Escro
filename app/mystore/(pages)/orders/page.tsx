"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sellerService } from "@/services/seller";
import { useMoney } from "@/app/mystore/_components/currency";
import OrderStatsBar from "./_components/order-stats";
import OrdersTable, {
  actionConfig,
  getCustomerName,
  type Order,
  type OrderAction,
  type OrderStats,
  type OrderStatus,
} from "./_components/orders-table";
import OrderDetails from "./_components/order-details";
import {
  IconAlertCircle,
  IconCircleCheck,
  IconCloudDownload,
  IconPackage,
  IconRefresh,
  IconSearch,
  IconShoppingBag,
  IconX,
  Loader,
} from "@/components/icons";

const EMPTY_STATS: OrderStats = { total: 0, pending: 0, completed: 0, cancelled: 0 };

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

type DateRange = "all" | "today" | "7days" | "30days" | "90days";

// Same buckets the backend uses for its stats.
const statsBucket = (status: string): keyof Omit<OrderStats, "total"> | null => {
  if (["pending", "confirmed", "processing"].includes(status)) return "pending";
  if (["delivered", "completed"].includes(status)) return "completed";
  if (["cancelled", "refunded"].includes(status)) return "cancelled";
  return null;
};

function rangeStart(range: DateRange): number | null {
  if (range === "all") return null;
  const now = new Date();
  if (range === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
  const days = range === "7days" ? 7 : range === "30days" ? 30 : 90;
  return now.getTime() - days * 24 * 60 * 60 * 1000;
}

const errorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
};

const csvCell = (value: unknown) => {
  let s = value == null ? "" : String(value);
  // Avoid spreadsheet formula injection from customer-entered text
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

type PendingDialog = { order: Order; action: "shipped" | "cancelled" } | null;
type Notice = { type: "success" | "error"; message: string } | null;

const Page = () => {
  const { currency } = useMoney();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateRange>("all");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [pendingDialog, setPendingDialog] = useState<PendingDialog>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = (await sellerService.getOrders()) as
        | { orders?: Order[]; stats?: OrderStats }
        | undefined;
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
      setStats({ ...EMPTY_STATS, ...(data?.stats ?? {}) });
    } catch (err) {
      setLoadError(errorMessage(err, "Failed to load orders"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId]
  );

  const handleViewDetails = (order: Order) => {
    setSelectedId(order.id);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setTimeout(() => setSelectedId(null), 300);
  };

  const runUpdate = async (order: Order, status: OrderAction, tracking?: string) => {
    setBusyId(order.id);
    try {
      const updated = (await sellerService.updateOrderStatus(order.id, status, tracking)) as
        | Order
        | undefined;
      const next: Order = updated && updated.id ? updated : { ...order, status };
      setOrders((prev) => prev.map((o) => (o.id === next.id ? next : o)));
      setStats((prev) => {
        const from = statsBucket(order.status);
        const to = statsBucket(next.status);
        if (from === to) return prev;
        const copy = { ...prev };
        if (from) copy[from] = Math.max(0, copy[from] - 1);
        if (to) copy[to] += 1;
        return copy;
      });
      setNotice({
        type: "success",
        message: `Order #${next.orderNumber} is now ${next.status}.`,
      });
      return true;
    } catch (err) {
      const message = errorMessage(err, "Couldn't update the order");
      if (status === "shipped" || status === "cancelled") {
        setDialogError(message);
      } else {
        setNotice({ type: "error", message });
      }
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleAction = (order: Order, action: OrderAction) => {
    if (action === "shipped" || action === "cancelled") {
      setTrackingNumber(order.trackingNumber ?? "");
      setDialogError(null);
      setPendingDialog({ order, action });
      return;
    }
    void runUpdate(order, action);
  };

  const confirmDialog = async () => {
    if (!pendingDialog) return;
    const { order, action } = pendingDialog;
    if (action === "shipped" && !trackingNumber.trim()) {
      setDialogError("Enter a tracking number to mark this order as shipped.");
      return;
    }
    setDialogError(null);
    const ok = await runUpdate(
      order,
      action,
      action === "shipped" ? trackingNumber.trim() : undefined
    );
    if (ok) setPendingDialog(null);
  };

  // Filter orders based on search and filters
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const from = rangeStart(dateFilter);
    return orders.filter((order) => {
      const searchMatch =
        q === "" ||
        (order.orderNumber ?? "").toLowerCase().includes(q) ||
        getCustomerName(order).toLowerCase().includes(q) ||
        (order.customer?.email ?? "").toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" || order.status === statusFilter;
      const created = new Date(order.createdAt).getTime();
      const dateMatch = from === null || (!Number.isNaN(created) && created >= from);
      return searchMatch && statusMatch && dateMatch;
    });
  }, [orders, searchQuery, statusFilter, dateFilter]);

  const hasFilters = searchQuery !== "" || statusFilter !== "all" || dateFilter !== "all";

  const exportCsv = () => {
    const code = currency.toUpperCase();
    const header = [
      "Order Number",
      "Date",
      "Customer",
      "Email",
      "Phone",
      "Items",
      `Subtotal (${code})`,
      `Shipping (${code})`,
      `Tax (${code})`,
      `Total (${code})`,
      "Payment Status",
      "Order Status",
      "Tracking Number",
      "Shipping Address",
    ];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      o.createdAt,
      getCustomerName(o),
      o.customer?.email ?? "",
      o.customer?.phone ?? o.shipping?.phone ?? "",
      o.items.map((i) => `${i.name} x${i.quantity}`).join("; "),
      o.subtotal,
      o.shippingFee,
      o.tax,
      o.total,
      o.paymentStatus,
      o.status,
      o.trackingNumber ?? "",
      [o.shipping?.address, o.shipping?.city, o.shipping?.state, o.shipping?.zip, o.shipping?.country]
        .filter(Boolean)
        .join(", "),
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const dialogAction = pendingDialog?.action;
  const dialogBusy = !!pendingDialog && busyId === pendingDialog.order.id;

  return (
    <div className="page-container py-6 sm:py-8">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="eyebrow font-space text-emerald-700">Fulfilment</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">Orders</h1>
            <p className="mt-2 text-sm text-black/55 sm:text-base">Manage and track all your orders</p>
          </div>
          <Button
            onClick={exportCsv}
            disabled={loading || filteredOrders.length === 0}
            className="h-11 w-fit rounded-full bg-ink pl-1.5 pr-5 font-bold text-white transition-colors hover:bg-ink-soft focus-visible:ring-2 focus-visible:ring-lime-dark/60"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink"><IconCloudDownload className="h-4 w-4" /></span>
            Export Orders
          </Button>
        </div>

        {/* Action notice */}
        {notice && (
          <div
            role="status"
            className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ring-1 ${
              notice.type === "success"
                ? "bg-emerald-50 text-emerald-800 ring-emerald-600/15"
                : "bg-red-50 text-red-700 ring-red-600/15"
            }`}
          >
            {notice.type === "success" ? (
              <IconCircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <IconAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p className="min-w-0 flex-1">{notice.message}</p>
            <button
              onClick={() => setNotice(null)}
              className="rounded-full p-0.5 opacity-60 hover:opacity-100"
              aria-label="Dismiss"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        )}

        {loading ? (
          /* Loading skeleton */
          <div className="space-y-6" aria-busy="true" aria-label="Loading orders">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[76px] animate-pulse rounded-3xl bg-white ring-1 ring-black/5 sm:h-[86px]" />
              ))}
            </div>
            <div className="h-[68px] animate-pulse rounded-3xl bg-white ring-1 ring-black/5" />
            <div className="surface-card divide-y divide-black/5 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-black/10" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded-lg bg-black/10" />
                    <div className="h-3 w-48 max-w-full animate-pulse rounded-lg bg-black/[0.07]" />
                  </div>
                  <div className="hidden h-6 w-20 animate-pulse rounded-full bg-black/[0.07] sm:block" />
                  <div className="h-4 w-16 animate-pulse rounded-lg bg-black/10" />
                </div>
              ))}
            </div>
          </div>
        ) : loadError ? (
          /* Error state */
          <div className="surface-card px-6 py-12 text-center sm:py-16">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
              <IconAlertCircle className="h-7 w-7 text-red-600" />
            </div>
            <h3 className="mb-1 text-xl font-extrabold tracking-[-0.02em] text-ink">
              Couldn&apos;t load your orders
            </h3>
            <p className="mx-auto mb-6 max-w-sm text-sm text-black/55">{loadError}</p>
            <Button
              onClick={() => void loadOrders()}
              className="h-11 rounded-full bg-ink px-5 font-bold text-white hover:bg-ink-soft"
            >
              <IconRefresh className="h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Quick Stats Bar */}
            <OrderStatsBar stats={stats} />

            {/* Search and Filter Bar */}
            <div className="surface-card p-3 sm:p-4">
              <div className="flex flex-col gap-3 xl:flex-row">
                {/* Search */}
                <div className="relative min-w-0 flex-1">
                  <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                  <Input
                    type="text"
                    placeholder="Search by order ID, customer name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 w-full rounded-full border-0 bg-cream/70 pl-10 pr-4 text-sm text-ink shadow-none ring-1 ring-black/5 placeholder:text-black/40 focus:bg-white focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-lime-dark/60"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-11! w-full rounded-full border-2 border-ink/15 bg-transparent px-4 font-mont font-semibold text-ink shadow-none sm:w-[170px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={dateFilter}
                    onValueChange={(v) => setDateFilter(v as DateRange)}
                  >
                    <SelectTrigger className="h-11! w-full rounded-full border-2 border-ink/15 bg-transparent px-4 font-mont font-semibold text-ink shadow-none sm:w-[170px]">
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="90days">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            {filteredOrders.length > 0 ? (
              <OrdersTable
                orders={filteredOrders}
                onViewDetails={handleViewDetails}
                onAction={handleAction}
                busyId={busyId}
              />
            ) : (
              /* Empty State */
              <div className="surface-card px-6 py-12 text-center sm:py-16">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink">
                  {hasFilters ? (
                    <IconSearch className="h-7 w-7 text-lime" />
                  ) : (
                    <IconPackage className="h-7 w-7 text-lime" />
                  )}
                </div>
                <h3 className="mb-1 text-xl font-extrabold tracking-[-0.02em] text-ink">
                  {hasFilters ? "No orders match your filters" : "No orders yet"}
                </h3>
                <p className="mx-auto mb-6 max-w-sm text-sm text-black/55">
                  {hasFilters
                    ? "Try adjusting your search or filter criteria"
                    : "When customers place orders, they'll appear here"}
                </p>
                {hasFilters ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setDateFilter("all");
                    }}
                    className="h-11 rounded-full border-2 border-ink/15 px-6 font-bold text-ink shadow-none hover:border-ink hover:bg-transparent"
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Button asChild className="h-11 rounded-full bg-ink px-5 font-bold text-white hover:bg-ink-soft">
                    <Link href="/mystore/products">
                      <IconShoppingBag className="h-4 w-4" />
                      Manage Products
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* Order Details Side Panel */}
        <OrderDetails
          order={selectedOrder}
          open={detailsOpen}
          onClose={handleCloseDetails}
          onAction={handleAction}
          busy={!!selectedOrder && busyId === selectedOrder.id}
        />

        {/* Ship / Cancel confirmation */}
        <Dialog
          open={!!pendingDialog}
          onOpenChange={(open) => {
            if (!open && !dialogBusy) setPendingDialog(null);
          }}
        >
          <DialogContent className="rounded-3xl border-0 bg-cream p-6 font-mont sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold tracking-[-0.02em] text-ink">
                {dialogAction === "shipped" ? "Mark as shipped" : "Cancel this order?"}
              </DialogTitle>
              <DialogDescription className="text-sm text-black/55">
                {pendingDialog &&
                  (dialogAction === "shipped"
                    ? `Add the courier tracking number for order #${pendingDialog.order.orderNumber}. The buyer will use it to follow the delivery.`
                    : `Order #${pendingDialog.order.orderNumber} will be cancelled. This can't be undone.`)}
              </DialogDescription>
            </DialogHeader>

            {dialogAction === "shipped" && (
              <form
                id="ship-order-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void confirmDialog();
                }}
              >
                <label htmlFor="tracking-number" className="mb-1.5 block text-sm font-semibold text-ink">
                  Tracking number
                </label>
                <Input
                  id="tracking-number"
                  autoFocus
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. GIG123456789"
                  className="h-11 rounded-full border-0 bg-white px-4 text-sm text-ink shadow-none ring-1 ring-black/10 focus-visible:ring-2 focus-visible:ring-lime-dark/60"
                />
              </form>
            )}

            {dialogError && (
              <p className="flex items-start gap-2 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-600/15">
                <IconAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {dialogError}
              </p>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                disabled={dialogBusy}
                onClick={() => setPendingDialog(null)}
                className="h-11 rounded-full border-2 border-ink/15 bg-white px-5 font-bold text-ink shadow-none hover:border-ink hover:bg-white"
              >
                {dialogAction === "cancelled" ? "Keep order" : "Back"}
              </Button>
              <Button
                type={dialogAction === "shipped" ? "submit" : "button"}
                form={dialogAction === "shipped" ? "ship-order-form" : undefined}
                disabled={dialogBusy}
                onClick={dialogAction === "shipped" ? undefined : () => void confirmDialog()}
                className={`h-11 rounded-full px-5 font-bold text-white ${
                  dialogAction === "cancelled"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-ink hover:bg-ink-soft"
                }`}
              >
                {dialogBusy && <Loader className="h-4 w-4 animate-spin" />}
                {dialogAction ? actionConfig[dialogAction].label : ""}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Page;
