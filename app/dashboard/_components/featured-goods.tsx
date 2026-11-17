"use client";

/* eslint-disable @next/next/no-img-element -- seller-uploaded images come from arbitrary hosts */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  IconPhoto,
  IconShieldCheck,
  IconShoppingCart,
  IconStar,
  IconX,
  Loader2,
  RefreshCw,
  ShoppingBag,
  AlertCircle,
} from "@/components/icons";
import { shopService } from "@/services/shop";
import { formatMoney } from "@/lib/money";
import { useCart } from "./cart-context";

/* ------------------------------------------------------------------ */
/* Shared marketplace types + helpers (used by shop / stores pages)    */
/* ------------------------------------------------------------------ */

export type ShopStoreRef = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  verified: boolean;
  currency: string;
};

export type ShopProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  inStock: boolean;
  rating: number;
  reviews: number;
  sales: number;
  image: string | null;
  images: string[];
  category: { id: string; name: string; slug: string } | null;
  store: ShopStoreRef;
  createdAt: string;
};

export type ShopCategory = { id: string; name: string; slug: string; count: number };

export type ShopStore = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  logo: string | null;
  banner: string | null;
  verified: boolean;
  rating: number;
  reviews: number;
  currency: string;
  productCount: number;
  createdAt: string;
};

export type ProductPage = { products: ShopProduct[]; total: number; page: number; pages: number };

export const errorMessage = (e: unknown, fallback = "Something went wrong") =>
  (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string"
    ? (e as { message: string }).message
    : "") || fallback;

const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/** Product added within the last 14 days. */
export function isNewProduct(createdAt?: string | null) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  return Number.isFinite(t) && Date.now() - t < NEW_WINDOW_MS;
}

/** Whole-percent discount when comparePrice > price, else 0. */
export function discountPercent(p: Pick<ShopProduct, "price" | "comparePrice">) {
  const price = Number(p.price);
  const compare = Number(p.comparePrice);
  if (!compare || !(compare > price)) return 0;
  return Math.round(((compare - price) / compare) * 100);
}

export function initials(name?: string | null) {
  return (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/** Debounced copy of a value. */
export function useDebounced<T>(value: T, ms = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/* ------------------------------------------------------------------ */
/* Add-to-cart with toast feedback                                      */
/* ------------------------------------------------------------------ */

type Notice = { kind: "ok" | "err"; text: string; id: number };

export function useAddToCart() {
  const { add, busyId } = useCart();
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), notice.kind === "ok" ? 4000 : 5500);
    return () => clearTimeout(t);
  }, [notice]);

  const addToCart = useCallback(
    async (product: Pick<ShopProduct, "id" | "name">, quantity = 1) => {
      try {
        await add(product.id, quantity);
        setNotice({ kind: "ok", text: `${product.name} added to cart`, id: Date.now() });
        return true;
      } catch (e) {
        setNotice({ kind: "err", text: errorMessage(e, "Couldn't add this item to your cart"), id: Date.now() });
        return false;
      }
    },
    [add]
  );

  const toast = <CartToast notice={notice} onClose={() => setNotice(null)} />;
  return { addToCart, busyId, toast };
}

function CartToast({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-3 bottom-4 z-[60] flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      {notice && (
        <div
          key={notice.id}
          className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl p-3 pr-2 shadow-[0_24px_48px_-20px_rgba(12,17,14,0.55)] animate-in fade-in slide-in-from-bottom-2 ${
            notice.kind === "ok" ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-red-200"
          }`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              notice.kind === "ok" ? "bg-lime text-ink" : "bg-red-50 text-red-600"
            }`}
          >
            {notice.kind === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          </span>
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            <span className="line-clamp-2">{notice.text}</span>
          </p>
          {notice.kind === "ok" && (
            <Link
              href="/dashboard/cart"
              className="shrink-0 rounded-full bg-lime px-3 py-2 text-xs font-bold text-ink transition-transform hover:scale-[1.03]"
            >
              View cart
            </Link>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
              notice.kind === "ok" ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-black/40 hover:bg-cream hover:text-ink"
            }`}
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product visuals                                                       */
/* ------------------------------------------------------------------ */

export function ProductImage({
  src,
  alt,
  className = "",
  iconClassName = "h-10 w-10",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  iconClassName?: string;
}) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#fff_0,transparent_55%)] bg-cream ${className}`}
        aria-label={alt}
        role="img"
      >
        <IconPhoto className={`${iconClassName} text-black/15`} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

export function RatingLabel({ rating, reviews, size = "sm" }: { rating: number; reviews: number; size?: "sm" | "md" }) {
  const r = Number(rating) || 0;
  const text = size === "md" ? "text-xs" : "text-[11px]";
  if (r <= 0) {
    return (
      <span className={`inline-flex items-center gap-1 font-space ${text} text-black/45`}>
        <IconStar className="h-3.5 w-3.5 text-black/25" />
        New
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <IconStar className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className={`font-space ${text} font-bold text-ink`}>{r.toFixed(1)}</span>
      <span className={`font-space ${text} text-black/40`}>({reviews})</span>
    </span>
  );
}

export function ProductCard({
  product,
  onAdd,
  busy,
}: {
  product: ShopProduct;
  onAdd: (p: ShopProduct) => void;
  busy: boolean;
}) {
  const href = `/dashboard/shop/${product.id}`;
  const discount = discountPercent(product);
  const fresh = isNewProduct(product.createdAt);
  const currency = product.store?.currency;

  return (
    <div className="group relative flex min-w-0 flex-col overflow-hidden rounded-3xl bg-white p-2 ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgba(12,17,14,0.35)]">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-square overflow-hidden rounded-2xl bg-cream"
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          className="transition-transform duration-500 group-hover:scale-105"
        />

        {!product.inStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-ink/50 backdrop-blur-[2px]">
            <span className="rounded-full bg-white px-3 py-1 font-space text-[10px] font-bold uppercase tracking-widest text-ink">
              Out of stock
            </span>
          </span>
        )}

        <span className="absolute left-2 top-2 flex flex-col items-start gap-1.5 sm:left-3 sm:top-3">
          {fresh && (
            <span className="rounded-full bg-ink px-2 py-0.5 font-space text-[10px] font-bold uppercase tracking-wider text-lime">
              New
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-rose-500 px-2 py-0.5 font-space text-[10px] font-bold text-white">
              -{discount}%
            </span>
          )}
        </span>

        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-lime px-2 py-1 text-[10px] font-bold text-ink sm:right-3 sm:top-3">
          <IconShieldCheck className="h-3 w-3" />
          <span className="hidden sm:inline">Escrow</span>
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-2 pt-3 sm:p-3">
        {product.category && (
          <span className="truncate font-space text-[10px] uppercase tracking-widest text-black/45">
            {product.category.name}
          </span>
        )}
        <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-ink">
          <Link
            href={href}
            className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 after:absolute after:inset-0 after:content-['']"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
          <span className="truncate text-xs text-black/50">{product.store?.name}</span>
          {product.store?.verified && <IconShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
        </div>
        <div className="mt-1">
          <RatingLabel rating={product.rating} reviews={product.reviews} />
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-space text-sm font-bold tracking-tight text-ink sm:text-lg">
              {formatMoney(product.price, currency)}
            </span>
            {discount > 0 && (
              <span className="truncate font-space text-[11px] text-black/35 line-through">
                {formatMoney(product.comparePrice, currency)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onAdd(product)}
            disabled={!product.inStock || busy}
            aria-label={product.inStock ? `Add ${product.name} to cart` : `${product.name} is out of stock`}
            className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-all hover:scale-105 hover:bg-lime hover:text-ink active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/30 disabled:hover:scale-100"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconShoppingCart className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export const PRODUCT_GRID = "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={PRODUCT_GRID}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-3xl bg-white p-2 ring-1 ring-black/5">
          <div className="aspect-square rounded-2xl bg-cream" />
          <div className="space-y-2.5 p-2 pt-3 sm:p-3">
            <div className="h-3.5 w-3/4 rounded-full bg-black/5" />
            <div className="h-3 w-1/2 rounded-full bg-black/5" />
            <div className="h-5 w-1/3 rounded-full bg-black/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StateCard({
  tone = "neutral",
  icon,
  title,
  text,
  action,
}: {
  tone?: "neutral" | "error" | "lime";
  icon: React.ReactNode;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  const iconBg = tone === "error" ? "bg-red-50 text-red-600" : tone === "lime" ? "bg-lime text-ink" : "bg-cream text-ink";
  return (
    <div className="surface-card flex flex-col items-center px-6 py-14 text-center">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg}`}>{icon}</div>
      <p className="mt-4 text-lg font-extrabold tracking-tight text-ink">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-black/55">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
    >
      <RefreshCw className="h-4 w-4" />
      Try again
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Home: newest products                                                */
/* ------------------------------------------------------------------ */

type HomeState = { key: number; products: ShopProduct[]; error: string | null };

export default function FeaturedGoods() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<HomeState>({ key: -1, products: [], error: null });
  const { addToCart, busyId, toast } = useAddToCart();

  useEffect(() => {
    let cancelled = false;
    shopService
      .getProducts({ sort: "newest", limit: 8 })
      .then((res: ProductPage) => {
        if (!cancelled) setState({ key: attempt, products: res?.products ?? [], error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ key: attempt, products: [], error: errorMessage(e, "Failed to load products") });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const loading = state.key !== attempt;
  const { products, error } = state;

  return (
    <section className="py-10 md:py-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
        <div className="min-w-0">
          <p className="eyebrow font-space text-emerald-700">Just in</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl">New arrivals</h2>
          <p className="mt-1 text-sm text-black/55">The latest products listed by sellers on Escro</p>
        </div>
        {!loading && products.length > 0 && (
          <Link
            href="/dashboard/shop"
            className="group inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border-2 border-ink/15 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
          >
            See all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {loading ? (
        <ProductGridSkeleton count={4} />
      ) : error ? (
        <StateCard
          tone="error"
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Couldn't load products"
          text={error}
          action={<RetryButton onClick={() => setAttempt((a) => a + 1)} />}
        />
      ) : products.length === 0 ? (
        <StateCard
          tone="lime"
          icon={<ShoppingBag className="h-6 w-6" />}
          title="No products yet"
          text="Sellers haven't listed anything yet. Check back soon for new arrivals."
        />
      ) : (
        <div className={PRODUCT_GRID}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addToCart} busy={busyId === product.id} />
          ))}
        </div>
      )}
      {toast}
    </section>
  );
}
