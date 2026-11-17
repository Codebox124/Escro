"use client";

/* eslint-disable @next/next/no-img-element -- store logos come from arbitrary hosts */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  IconBuildingStore,
  IconChevronRight,
  Lock,
  IconPlus,
  IconShieldCheck,
  IconShoppingCart,
  IconTag,
  IconTruck,
  IconCircleCheck,
  Loader2,
  ShoppingBag,
  PackageCheck,
} from "@/components/icons";
import { shopService } from "@/services/shop";
import { formatMoney } from "@/lib/money";
import {
  PRODUCT_GRID,
  ProductCard,
  ProductImage,
  RatingLabel,
  RetryButton,
  StateCard,
  discountPercent,
  errorMessage,
  initials,
  isNewProduct,
  useAddToCart,
  type ShopProduct,
} from "../../_components/featured-goods";

type State = {
  key: string;
  product: ShopProduct | null;
  related: ShopProduct[];
  error: string | null;
  notFound: boolean;
};

const isNotFound = (msg: string) => /not\s*found|404|no product/i.test(msg);

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [attempt, setAttempt] = useState(0);
  const key = `${id}#${attempt}`;
  const [state, setState] = useState<State>({ key: "", product: null, related: [], error: null, notFound: false });

  useEffect(() => {
    let cancelled = false;
    shopService
      .getProduct(id)
      .then((r: { product?: ShopProduct; related?: ShopProduct[] }) => {
        if (cancelled) return;
        setState({
          key,
          product: r?.product ?? null,
          related: r?.related ?? [],
          error: null,
          notFound: !r?.product,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = errorMessage(e, "Failed to load this product");
        setState({ key, product: null, related: [], error: msg, notFound: isNotFound(msg) });
      });
    return () => {
      cancelled = true;
    };
  }, [id, key]);

  const loading = state.key !== key;

  return (
    <div className="page-container py-6 md:py-8">
      <Link
        href="/dashboard/shop"
        className="mb-5 inline-flex h-10 items-center gap-2 rounded-full bg-white pl-2 pr-4 text-sm font-semibold text-ink ring-1 ring-black/5 transition-colors hover:ring-ink/30"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cream">
          <ArrowLeft className="h-3.5 w-3.5" />
        </span>
        Back to shop
      </Link>

      {loading ? (
        <DetailSkeleton />
      ) : state.notFound ? (
        <StateCard
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Product not found"
          text="This product may have been removed or is no longer available."
          action={
            <Link
              href="/dashboard/shop"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
            >
              Browse products
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : state.error || !state.product ? (
        <StateCard
          tone="error"
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Couldn't load this product"
          text={state.error ?? undefined}
          action={<RetryButton onClick={() => setAttempt((a) => a + 1)} />}
        />
      ) : (
        <ProductView key={state.product.id} product={state.product} related={state.related} />
      )}
    </div>
  );
}

function ProductView({ product, related }: { product: ShopProduct; related: ShopProduct[] }) {
  const router = useRouter();
  const { addToCart, busyId, toast } = useAddToCart();
  const currency = product.store?.currency;

  const gallery = Array.from(new Set([product.image, ...(product.images ?? [])].filter(Boolean) as string[]));
  const [active, setActive] = useState(0);
  const mainImage = gallery[active] ?? null;

  const maxQty = Math.max(1, Number(product.stock) || 0);
  const [qty, setQty] = useState(1);
  const [pending, setPending] = useState<"add" | "buy" | null>(null);
  const busy = busyId === product.id;

  const discount = discountPercent(product);
  const fresh = isNewProduct(product.createdAt);
  const stock = Number(product.stock) || 0;

  const onAdd = async () => {
    setPending("add");
    await addToCart(product, qty);
    setPending(null);
  };
  const onBuyNow = async () => {
    setPending("buy");
    const ok = await addToCart(product, qty);
    setPending(null);
    if (ok) router.push("/dashboard/cart");
  };

  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5 flex min-w-0 items-center gap-1.5 text-xs text-black/50">
        <Link href="/dashboard/shop" className="shrink-0 hover:text-ink">
          Shop
        </Link>
        {product.category && (
          <>
            <IconChevronRight className="h-3 w-3 shrink-0" />
            <Link
              href={`/dashboard/shop?category=${encodeURIComponent(product.category.slug)}`}
              className="shrink-0 hover:text-ink"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <IconChevronRight className="h-3 w-3 shrink-0" />
        <span className="truncate font-semibold text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        {/* Gallery */}
        <div className="min-w-0">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-white p-2 ring-1 ring-black/5">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-cream">
              <ProductImage key={mainImage ?? "none"} src={mainImage} alt={product.name} iconClassName="h-16 w-16" />
              <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                {fresh && (
                  <span className="rounded-full bg-ink px-2.5 py-1 font-space text-[10px] font-bold uppercase tracking-wider text-lime">
                    New
                  </span>
                )}
                {discount > 0 && (
                  <span className="rounded-full bg-rose-500 px-2.5 py-1 font-space text-[10px] font-bold text-white">
                    -{discount}%
                  </span>
                )}
              </div>
            </div>
          </div>
          {gallery.length > 1 && (
            <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:px-0">
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-pressed={i === active}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-cream transition-all sm:h-20 sm:w-20 ${
                    i === active ? "ring-2 ring-ink ring-offset-2 ring-offset-cream" : "opacity-70 ring-1 ring-black/5 hover:opacity-100"
                  }`}
                >
                  <ProductImage src={src} alt="" iconClassName="h-5 w-5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {product.category && (
              <Link
                href={`/dashboard/shop?category=${encodeURIComponent(product.category.slug)}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 font-space text-[11px] uppercase tracking-widest text-emerald-700 ring-1 ring-black/5 hover:ring-ink/30"
              >
                <IconTag className="h-3.5 w-3.5" />
                {product.category.name}
              </Link>
            )}
            <span className="inline-flex h-8 items-center gap-1 rounded-full bg-lime px-3 text-[11px] font-bold text-ink">
              <IconShieldCheck className="h-3.5 w-3.5" />
              Escrow protected
            </span>
          </div>

          <h1 className="mt-4 break-words text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl md:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <RatingLabel rating={product.rating} reviews={product.reviews} size="md" />
            {product.sales > 0 && (
              <>
                <span className="text-black/20">·</span>
                <span className="font-space text-xs text-black/50">{product.sales.toLocaleString()} sold</span>
              </>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-space text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {formatMoney(product.price, currency)}
            </span>
            {discount > 0 && (
              <>
                <span className="font-space text-base text-black/35 line-through">
                  {formatMoney(product.comparePrice, currency)}
                </span>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 font-space text-xs font-bold text-rose-600">
                  Save {formatMoney(Number(product.comparePrice) - Number(product.price), currency)}
                </span>
              </>
            )}
          </div>

          <div className="mt-3">
            {!product.inStock || stock <= 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Out of stock
              </span>
            ) : stock <= 5 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Only {stock} left
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                In stock · <span className="font-space">{stock}</span> available
              </span>
            )}
          </div>

          {/* Quantity + actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-12 shrink-0 items-center justify-between rounded-full bg-white p-1 ring-1 ring-black/10 sm:justify-start">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1 || !product.inStock}
                aria-label="Decrease quantity"
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-ink transition-colors hover:bg-cream disabled:opacity-30 disabled:hover:bg-transparent"
              >
                −
              </button>
              <span className="w-12 text-center font-space text-base font-bold text-ink" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty || !product.inStock}
                aria-label="Increase quantity"
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <IconPlus className="h-4 w-4" />
              </button>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onAdd}
                disabled={!product.inStock || busy}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-ink/15 px-4 text-sm font-semibold text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink/15"
              >
                {busy && pending === "add" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconShoppingCart className="h-4 w-4" />
                )}
                <span className="truncate">Add to cart</span>
              </button>
              <button
                type="button"
                onClick={onBuyNow}
                disabled={!product.inStock || busy}
                className="group inline-flex h-12 items-center justify-between gap-2 rounded-full bg-ink pl-5 pr-1.5 text-sm font-semibold text-white transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="truncate">Buy now</span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime text-ink transition-transform group-hover:translate-x-0.5">
                  {busy && pending === "buy" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </span>
              </button>
            </div>
          </div>
          {product.inStock && stock > 0 && (
            <p className="mt-2 font-space text-[11px] text-black/45">
              Total {formatMoney(Number(product.price) * qty, currency)}
            </p>
          )}

          {/* Escrow explainer */}
          <div className="relative mt-6 overflow-hidden rounded-3xl bg-ink p-5 text-white sm:p-6">
            <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-lime/15 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime text-ink">
                <Lock className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-space text-[10px] uppercase tracking-widest text-lime">Escrow protected</p>
                <p className="text-sm font-bold">Your money is safe until the item arrives</p>
              </div>
            </div>
            <ol className="relative mt-4 grid gap-3 text-sm text-white/70 sm:grid-cols-3">
              {[
                { icon: Lock, text: "You pay — Escro holds the funds, not the seller." },
                { icon: IconTruck, text: "The seller ships your order." },
                { icon: PackageCheck, text: "You confirm delivery, then the seller gets paid." },
              ].map(({ icon: Icon, text }, i) => (
                <li key={i} className="flex gap-2.5 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10 sm:flex-col">
                  <Icon className="h-4 w-4 shrink-0 text-lime" />
                  <span className="text-xs leading-relaxed">{text}</span>
                </li>
              ))}
            </ol>
            <p className="relative mt-3 text-xs text-white/50">
              Something wrong? Open a dispute before confirming and your money stays held.
            </p>
          </div>

          {/* Store card */}
          {product.store && (
            <Link
              href={`/dashboard/stores/${product.store.id}`}
              className="group mt-4 flex items-center gap-3 rounded-3xl bg-white p-3 ring-1 ring-black/5 transition-all hover:shadow-[0_24px_48px_-24px_rgba(12,17,14,0.3)] hover:ring-ink/20 sm:p-4"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cream font-space text-sm font-bold text-ink">
                {product.store.logo ? (
                  <img src={product.store.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(product.store.name)
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-space text-[10px] uppercase tracking-widest text-black/45">Sold by</span>
                <span className="flex items-center gap-1.5">
                  <span className="truncate font-bold text-ink">{product.store.name}</span>
                  {product.store.verified && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      <IconCircleCheck className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </span>
              </span>
              <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-cream px-3 text-xs font-semibold text-ink transition-colors group-hover:bg-lime sm:px-4">
                <IconBuildingStore className="h-4 w-4" />
                <span className="hidden sm:inline">Visit store</span>
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Description */}
      <section className="surface-card mt-8 p-5 sm:p-7">
        <p className="eyebrow font-space text-emerald-700">Details</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-ink sm:text-2xl">About this product</h2>
        {product.description ? (
          <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-black/65 sm:text-base">
            {product.description}
          </p>
        ) : (
          <p className="mt-3 text-sm text-black/45">The seller hasn&apos;t added a description yet.</p>
        )}
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
            <div>
              <p className="eyebrow font-space text-emerald-700">You may also like</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl">Related products</h2>
            </div>
          </div>
          <div className={PRODUCT_GRID}>
            {related.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} onAdd={(x) => void addToCart(x)} busy={busyId === p.id} />
            ))}
          </div>
        </section>
      )}
      {toast}
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid animate-pulse gap-6 lg:grid-cols-2 lg:gap-10">
      <div className="aspect-square rounded-3xl bg-white p-2 ring-1 ring-black/5">
        <div className="h-full w-full rounded-2xl bg-cream" />
      </div>
      <div className="space-y-4">
        <div className="h-8 w-40 rounded-full bg-black/5" />
        <div className="h-10 w-4/5 rounded-2xl bg-black/5" />
        <div className="h-4 w-32 rounded-full bg-black/5" />
        <div className="h-10 w-48 rounded-2xl bg-black/5" />
        <div className="h-12 w-full rounded-full bg-black/5" />
        <div className="h-40 w-full rounded-3xl bg-ink/10" />
        <div className="h-20 w-full rounded-3xl bg-black/5" />
      </div>
    </div>
  );
}
