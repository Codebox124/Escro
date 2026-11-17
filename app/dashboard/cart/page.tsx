"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  IconAlertTriangle,
  IconPlus,
  IconRefresh,
  IconShieldCheck,
  IconShoppingBag,
  IconShoppingCart,
  IconTrash,
  Loader2,
  Store,
} from "@/components/icons";
import { useCart, type CartItem } from "../_components/cart-context";
import { buyerService } from "@/services/shop";
import { formatMoney } from "@/lib/money";

const MIGRATION_RE = /003_customer_flow\.sql/;

const errMessage = (e: unknown, fallback: string) =>
  (e as { message?: string })?.message || fallback;

type StoreGroup = {
  store: CartItem["product"]["store"];
  items: CartItem[];
  subtotal: number;
  count: number;
};

function groupByStore(items: CartItem[]): StoreGroup[] {
  const map = new Map<string, StoreGroup>();
  for (const item of items) {
    const store = item.product.store;
    let g = map.get(store.id);
    if (!g) {
      g = { store, items: [], subtotal: 0, count: 0 };
      map.set(store.id, g);
    }
    g.items.push(item);
    g.subtotal += item.lineTotal;
    g.count += item.quantity;
  }
  return [...map.values()];
}

export default function CartPage() {
  const { items, count, loading, busyId, update, remove, clear, refresh } = useCart();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  // The shared cart context swallows load errors, so probe once here to surface them.
  const probe = useCallback(async () => {
    try {
      await buyerService.getCart();
      setLoadError(null);
      return true;
    } catch (e) {
      setLoadError(errMessage(e, "We couldn't load your cart."));
      return false;
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(probe);
  }, [probe]);

  const retry = async () => {
    setRetrying(true);
    if (await probe()) await refresh();
    setRetrying(false);
  };

  const run = async (action: () => Promise<void>) => {
    setActionError(null);
    try {
      await action();
    } catch (e) {
      setActionError(errMessage(e, "Something went wrong. Please try again."));
    }
  };

  const groups = useMemo(() => groupByStore(items), [items]);
  const currencies = useMemo(
    () => [...new Set(items.map((i) => i.product.store.currency || "ngn"))],
    [items]
  );
  const subtotal = items.reduce((n, i) => n + i.lineTotal, 0);
  const hasUnavailable = items.some((i) => !i.available);
  const canCheckout = items.length > 0 && !hasUnavailable;

  return (
    <div className="page-container py-6 md:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
        <div className="min-w-0">
          <p className="eyebrow font-space text-emerald-700">Your bag</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
            Cart
          </h1>
          <p className="mt-2 text-sm text-black/55 sm:text-base">
            {loading
              ? "Loading your items…"
              : items.length
              ? `${count} item${count === 1 ? "" : "s"} from ${groups.length} store${groups.length === 1 ? "" : "s"}`
              : "Nothing here yet"}
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            disabled={busyId !== null}
            onClick={() => {
              if (window.confirm("Remove every item from your cart?")) run(clear);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink/15 px-5 text-sm font-semibold text-ink transition-colors hover:border-red-400 hover:text-red-600 disabled:opacity-50"
          >
            {busyId === "all" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconTrash className="h-4 w-4" />
            )}
            Clear cart
          </button>
        )}
      </div>

      {loadError ? (
        <ErrorState message={loadError} onRetry={retry} retrying={retrying} />
      ) : loading ? (
        <CartSkeleton />
      ) : items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start xl:gap-8">
          <div className="min-w-0 space-y-4 sm:space-y-5">
            {actionError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-600/15"
              >
                <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="min-w-0 flex-1">{actionError}</p>
                <button
                  type="button"
                  onClick={() => setActionError(null)}
                  className="shrink-0 font-semibold underline-offset-2 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {hasUnavailable && (
              <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-600/20">
                <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Some items are out of stock or exceed what&apos;s available. Lower the
                  quantity or remove them to continue to checkout.
                </p>
              </div>
            )}

            {groups.map((group) => (
              <section key={group.store.id} className="surface-card overflow-hidden p-2">
                <header className="flex items-center gap-3 rounded-2xl bg-cream p-3 sm:p-4">
                  <StoreLogo name={group.store.name} logo={group.store.logo} />
                  <div className="min-w-0 flex-1">
                    <p className="font-space text-[10px] uppercase tracking-widest text-black/45">
                      Sold by
                    </p>
                    <p className="flex items-center gap-1.5 truncate font-bold text-ink">
                      <span className="truncate">{group.store.name}</span>
                      {group.store.verified && (
                        <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-3 py-1 font-space text-[11px] font-bold text-black/55">
                    {group.count} item{group.count === 1 ? "" : "s"}
                  </span>
                </header>

                <ul className="divide-y divide-black/5 px-2 sm:px-3">
                  {group.items.map((item) => (
                    <CartRow
                      key={item.id}
                      item={item}
                      busy={busyId === item.productId || busyId === "all"}
                      onQuantity={(q) => run(() => update(item.productId, q))}
                      onRemove={() => run(() => remove(item.productId))}
                    />
                  ))}
                </ul>

                <div className="mx-2 mb-2 mt-1 flex items-center justify-between gap-3 border-t border-black/5 px-1 pt-3 sm:mx-3">
                  <p className="text-sm font-semibold text-black/55">Store subtotal</p>
                  <p className="font-space text-base font-bold text-ink">
                    {formatMoney(group.subtotal, group.store.currency)}
                  </p>
                </div>
              </section>
            ))}

            <Link
              href="/dashboard/shop"
              className="inline-flex h-11 items-center gap-2 rounded-full px-1 text-sm font-semibold text-ink underline-offset-4 hover:underline"
            >
              <IconPlus className="h-4 w-4" />
              Keep shopping
            </Link>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-28">
            <div className="surface-card p-5 sm:p-6">
              <p className="eyebrow font-space text-black/45">Order summary</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-black/55">Items</dt>
                  <dd className="font-space font-bold text-ink">{count}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-black/55">Stores</dt>
                  <dd className="font-space font-bold text-ink">{groups.length}</dd>
                </div>
                <div className="flex items-end justify-between gap-3 border-t border-black/5 pt-3">
                  <dt className="font-semibold text-ink">Subtotal</dt>
                  <dd className="text-right font-space text-2xl font-bold tracking-tight text-ink">
                    {currencies.length <= 1
                      ? formatMoney(subtotal, currencies[0])
                      : groups.map((g) => (
                          <span key={g.store.id} className="block text-base">
                            {formatMoney(g.subtotal, g.store.currency)}
                          </span>
                        ))}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-black/50">
                Shipping and tax are calculated at checkout from each seller&apos;s settings.
              </p>

              {canCheckout ? (
                <Link
                  href="/dashboard/checkout"
                  className="group mt-5 flex h-12 w-full items-center justify-between rounded-full bg-ink pl-6 pr-1.5 font-semibold text-white transition-colors hover:bg-ink-soft"
                >
                  Checkout
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-ink transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-5 flex h-12 w-full cursor-not-allowed items-center justify-between rounded-full bg-ink/30 pl-6 pr-1.5 font-semibold text-white"
                >
                  Checkout
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/40 text-ink">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              )}
              {hasUnavailable && (
                <p className="mt-2 text-center text-xs font-medium text-amber-700">
                  Fix unavailable items to continue.
                </p>
              )}

              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-cream p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime text-ink">
                  <IconShieldCheck className="h-4 w-4" />
                </span>
                <p className="text-xs leading-relaxed text-black/60">
                  <span className="font-bold text-ink">Escrow protected.</span> Your payment is
                  held by Escro and only released to the seller after you confirm delivery.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function CartRow({
  item,
  busy,
  onQuantity,
  onRemove,
}: {
  item: CartItem;
  busy: boolean;
  onQuantity: (q: number) => void;
  onRemove: () => void;
}) {
  const { product } = item;
  const currency = product.store.currency;
  const max = Math.max(0, product.stock);
  const outOfStock = !product.inStock || max === 0;
  const overStock = !outOfStock && item.quantity > max;
  const lowStock = !outOfStock && !overStock && max <= 5;

  return (
    <li className={`flex gap-3 py-4 sm:gap-4 ${busy ? "opacity-60" : ""}`}>
      <Link
        href={`/dashboard/shop/${item.productId}`}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-cream sm:h-24 sm:w-24"
      >
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-black/30">
            <IconShoppingBag className="h-7 w-7" />
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/dashboard/shop/${item.productId}`}
              className="line-clamp-2 text-sm font-bold text-ink hover:underline sm:text-base"
            >
              {product.name}
            </Link>
            <p className="mt-0.5 font-space text-[11px] text-black/50">
              {formatMoney(product.price, currency)} each
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="ml-1.5 line-through">
                  {formatMoney(product.comparePrice, currency)}
                </span>
              )}
            </p>
          </div>
          <p className="shrink-0 font-space text-sm font-bold text-ink sm:text-base">
            {formatMoney(item.lineTotal, currency)}
          </p>
        </div>

        {outOfStock ? (
          <p className="w-fit rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 ring-1 ring-red-600/15">
            Out of stock — remove to continue
          </p>
        ) : overStock ? (
          <p className="w-fit rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 ring-1 ring-amber-600/20">
            Only {max} available — lower the quantity
          </p>
        ) : lowStock ? (
          <p className="w-fit rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 ring-1 ring-amber-600/20">
            Only {max} left
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <div
            className="inline-flex h-11 items-center rounded-full bg-cream p-1"
            role="group"
            aria-label={`Quantity for ${product.name}`}
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={busy || item.quantity <= 1}
              onClick={() => onQuantity(Math.min(item.quantity - 1, Math.max(max, 1)))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-ink transition-colors hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent"
            >
              −
            </button>
            <span className="min-w-9 text-center font-space text-sm font-bold text-ink" aria-live="polite">
              {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : item.quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={busy || outOfStock || item.quantity >= max}
              onClick={() => onQuantity(item.quantity + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent"
            >
              <IconPlus className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onRemove}
            className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-black/55 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <IconTrash className="h-4 w-4" />
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

function StoreLogo({ name, logo }: { name: string; logo: string | null }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink text-lime">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={name} className="h-full w-full object-cover" />
      ) : (
        <Store className="h-5 w-5" />
      )}
    </span>
  );
}

function EmptyCart() {
  return (
    <div className="surface-card flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-lime text-ink">
        <IconShoppingCart className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
        Your cart is empty
      </h2>
      <p className="mt-2 max-w-sm text-sm text-black/55">
        Find something you love — every purchase is protected by Escro escrow until you confirm
        delivery.
      </p>
      <Link
        href="/dashboard/shop"
        className="group mt-6 inline-flex h-12 items-center gap-3 rounded-full bg-ink pl-6 pr-1.5 font-semibold text-white transition-colors hover:bg-ink-soft"
      >
        Browse products
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-ink transition-transform group-hover:translate-x-0.5">
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
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
        {migration ? "Database setup needed" : "Couldn't load your cart"}
      </h2>
      <p
        className={`mt-1 max-w-md wrap-break-word text-sm ${
          migration ? "font-space text-amber-800" : "text-black/55"
        }`}
      >
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-soft disabled:opacity-60"
      >
        <IconRefresh className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
        Try again
      </button>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-8" aria-busy="true">
      <div className="space-y-4">
        {[0, 1].map((g) => (
          <div key={g} className="surface-card p-2">
            <div className="h-16 animate-pulse rounded-2xl bg-cream" />
            {[0, 1].map((r) => (
              <div key={r} className="flex gap-4 p-4">
                <div className="h-20 w-20 shrink-0 animate-pulse rounded-2xl bg-black/5 sm:h-24 sm:w-24" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-black/5" />
                  <div className="h-3 w-1/3 animate-pulse rounded-full bg-black/5" />
                  <div className="h-10 w-32 animate-pulse rounded-full bg-black/5" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="surface-card h-80 animate-pulse p-6" />
    </div>
  );
}
