"use client";

/* eslint-disable @next/next/no-img-element -- store banners/logos come from arbitrary hosts */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  IconBuildingStore,
  IconCalendar,
  IconCircleCheck,
  IconPackage,
  IconSearch,
  IconShieldCheck,
  IconStar,
  Loader2,
  ShoppingBag,
} from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shopService } from "@/services/shop";
import {
  PRODUCT_GRID,
  ProductCard,
  ProductGridSkeleton,
  RetryButton,
  StateCard,
  errorMessage,
  initials,
  useAddToCart,
  useDebounced,
  type ProductPage,
  type ShopProduct,
  type ShopStore,
} from "../../_components/featured-goods";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top rated" },
];
const PAGE_SIZE = 24;

type StoreState = { key: string; store: ShopStore | null; error: string | null; notFound: boolean };

const memberSince = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

export default function StorePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [attempt, setAttempt] = useState(0);
  const key = `${id}#${attempt}`;
  const [state, setState] = useState<StoreState>({ key: "", store: null, error: null, notFound: false });

  useEffect(() => {
    let cancelled = false;
    shopService
      .getStore(id)
      .then((r: { store?: ShopStore }) => {
        if (!cancelled) setState({ key, store: r?.store ?? null, error: null, notFound: !r?.store });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = errorMessage(e, "Failed to load this store");
        setState({ key, store: null, error: msg, notFound: /not\s*found|404|no store/i.test(msg) });
      });
    return () => {
      cancelled = true;
    };
  }, [id, key]);

  const loading = state.key !== key;

  return (
    <div className="page-container py-6 md:py-8">
      <Link
        href="/dashboard/stores"
        className="mb-5 inline-flex h-10 items-center gap-2 rounded-full bg-white pl-2 pr-4 text-sm font-semibold text-ink ring-1 ring-black/5 transition-colors hover:ring-ink/30"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cream">
          <ArrowLeft className="h-3.5 w-3.5" />
        </span>
        All stores
      </Link>

      {loading ? (
        <div className="animate-pulse">
          <div className="h-40 rounded-[28px] bg-ink/10 sm:h-56" />
          <div className="-mt-10 ml-5 h-20 w-20 rounded-3xl border-4 border-cream bg-black/10 sm:ml-8" />
          <div className="mt-4 h-8 w-56 rounded-2xl bg-black/5" />
          <div className="mt-3 h-4 w-80 max-w-full rounded-full bg-black/5" />
          <div className="mt-10">
            <ProductGridSkeleton count={4} />
          </div>
        </div>
      ) : state.notFound ? (
        <StateCard
          icon={<IconBuildingStore className="h-6 w-6" />}
          title="Store not found"
          text="This store may have closed or the link is incorrect."
          action={
            <Link
              href="/dashboard/stores"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
            >
              Browse stores
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : state.error || !state.store ? (
        <StateCard
          tone="error"
          icon={<IconBuildingStore className="h-6 w-6" />}
          title="Couldn't load this store"
          text={state.error ?? undefined}
          action={<RetryButton onClick={() => setAttempt((a) => a + 1)} />}
        />
      ) : (
        <>
          <StoreHeader store={state.store} />
          <StoreProducts key={state.store.id} storeId={state.store.id} storeName={state.store.name} />
        </>
      )}
    </div>
  );
}

function StoreHeader({ store }: { store: ShopStore }) {
  const rating = Number(store.rating) || 0;
  const since = memberSince(store.createdAt);
  return (
    <section>
      <div className="relative h-40 overflow-hidden rounded-[28px] bg-ink sm:h-56">
        {store.banner ? (
          <>
            <img src={store.banner} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-ink/60 to-transparent" />
          </>
        ) : (
          <>
            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-lime/15 blur-3xl" />
          </>
        )}
        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-space text-[10px] uppercase tracking-widest text-lime backdrop-blur">
          <IconShieldCheck className="h-3.5 w-3.5" />
          Escrow protected
        </span>
      </div>

      <div className="px-1 sm:px-6">
        <div className="-mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border-4 border-cream bg-white font-space text-2xl font-bold text-ink shadow-md sm:-mt-12 sm:h-24 sm:w-24">
          {store.logo ? <img src={store.logo} alt="" className="h-full w-full object-cover" /> : initials(store.name)}
        </div>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">{store.name}</h1>
              {store.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-1 text-xs font-bold text-ink">
                  <IconCircleCheck className="h-3.5 w-3.5" />
                  Verified seller
                </span>
              )}
            </div>
            {store.tagline && <p className="mt-2 text-base font-semibold text-black/70">{store.tagline}</p>}
            {store.description && (
              <p className="mt-2 max-w-2xl whitespace-pre-line break-words text-sm leading-relaxed text-black/55">
                {store.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm text-black/60 ring-1 ring-black/5">
              <IconPackage className="h-4 w-4 text-ink" />
              <strong className="font-space text-ink">{(store.productCount ?? 0).toLocaleString()}</strong>
              {store.productCount === 1 ? "product" : "products"}
            </span>
            <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm text-black/60 ring-1 ring-black/5">
              <IconStar className={`h-4 w-4 ${rating > 0 ? "fill-amber-400 text-amber-400" : "text-black/25"}`} />
              {rating > 0 ? (
                <>
                  <strong className="font-space text-ink">{rating.toFixed(1)}</strong>
                  <span className="font-space text-xs">({store.reviews})</span>
                </>
              ) : (
                "New"
              )}
            </span>
            {since && (
              <span className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm text-black/60 ring-1 ring-black/5">
                <IconCalendar className="h-4 w-4 text-ink" />
                Since <span className="font-space text-ink">{since}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

type ProductsState = { key: string; products: ShopProduct[]; page: number; pages: number; total: number; error: string | null };

function StoreProducts({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput.trim(), 400);
  const [sort, setSort] = useState("newest");
  const [attempt, setAttempt] = useState(0);
  const key = `${search}|${sort}|${attempt}`;
  const [res, setRes] = useState<ProductsState>({ key: "", products: [], page: 1, pages: 1, total: 0, error: null });
  const [more, setMore] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });
  const { addToCart, busyId, toast } = useAddToCart();

  useEffect(() => {
    let cancelled = false;
    shopService
      .getProducts({ store: storeId, search: search || undefined, sort, page: 1, limit: PAGE_SIZE })
      .then((r: ProductPage) => {
        if (cancelled) return;
        setRes({ key, products: r?.products ?? [], page: r?.page ?? 1, pages: r?.pages ?? 1, total: r?.total ?? 0, error: null });
        setMore({ loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setRes({ key, products: [], page: 1, pages: 1, total: 0, error: errorMessage(e, "Failed to load products") });
      });
    return () => {
      cancelled = true;
    };
  }, [key, storeId, search, sort]);

  const loading = res.key !== key;

  const loadMore = async () => {
    const k = res.key;
    setMore({ loading: true, error: null });
    try {
      const r: ProductPage = await shopService.getProducts({
        store: storeId,
        search: search || undefined,
        sort,
        page: res.page + 1,
        limit: PAGE_SIZE,
      });
      setRes((prev) => {
        if (prev.key !== k) return prev;
        const seen = new Set(prev.products.map((p) => p.id));
        return {
          ...prev,
          products: [...prev.products, ...(r?.products ?? []).filter((p) => !seen.has(p.id))],
          page: r?.page ?? prev.page + 1,
          pages: r?.pages ?? prev.pages,
          total: r?.total ?? prev.total,
        };
      });
      setMore({ loading: false, error: null });
    } catch (e) {
      setMore({ loading: false, error: errorMessage(e, "Couldn't load more products") });
    }
  };

  return (
    <section className="mt-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow font-space text-emerald-700">Catalogue</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl">
            Products from {storeName}
          </h2>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-2 rounded-[28px] bg-white p-2 ring-1 ring-black/5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          <Input
            type="search"
            placeholder="Search this store..."
            aria-label="Search this store"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-12 w-full rounded-full border-0 bg-cream pl-11 pr-4 text-sm text-ink shadow-none placeholder:text-black/40 transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-lime-dark/60"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger
            aria-label="Sort products"
            className="h-12! w-full rounded-full border-0 bg-cream px-4 text-sm font-medium text-ink shadow-none sm:w-[210px]"
          >
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && res.products.length === 0 ? (
        <ProductGridSkeleton count={8} />
      ) : res.error && !loading ? (
        <StateCard
          tone="error"
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Couldn't load products"
          text={res.error}
          action={<RetryButton onClick={() => setAttempt((a) => a + 1)} />}
        />
      ) : !loading && res.products.length === 0 ? (
        <StateCard
          icon={<IconSearch className="h-6 w-6" />}
          title={search ? "No matching products" : "No products yet"}
          text={search ? "Try a different search term." : "This store hasn't listed any products yet."}
        />
      ) : (
        <>
          <div className={`${PRODUCT_GRID} transition-opacity ${loading ? "pointer-events-none opacity-50" : ""}`} aria-busy={loading}>
            {res.products.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={addToCart} busy={busyId === p.id} />
            ))}
          </div>
          {!loading && (
            <div className="mt-8 flex flex-col items-center gap-3">
              <p className="font-space text-[11px] text-black/50">
                Showing {res.products.length} of {res.total.toLocaleString()}
              </p>
              {more.error && <p className="text-sm text-red-600">{more.error}</p>}
              {res.page < res.pages && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={more.loading}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                >
                  {more.loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {more.loading ? "Loading…" : "Load more"}
                </button>
              )}
            </div>
          )}
        </>
      )}
      {toast}
    </section>
  );
}
