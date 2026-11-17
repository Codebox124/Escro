"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  IconSearch,
  IconShoppingCart,
  IconFilter,
  IconCheck,
  IconX,
  IconLayoutGrid,
  Loader2,
  ShoppingBag,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { shopService } from "@/services/shop";
import {
  PRODUCT_GRID,
  ProductCard,
  ProductGridSkeleton,
  RetryButton,
  StateCard,
  errorMessage,
  useAddToCart,
  type ProductPage,
  type ShopCategory,
  type ShopProduct,
} from "../_components/featured-goods";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top rated" },
] as const;

const PAGE_SIZE = 24;

type Results = {
  key: string;
  products: ShopProduct[];
  page: number;
  pages: number;
  total: number;
  error: string | null;
};

const EMPTY: Results = { key: "", products: [], page: 1, pages: 1, total: 0, error: null };

const cleanNum = (v: string) => {
  const n = Number(v);
  return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? String(n) : "";
};

function ShopPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const sp = useSearchParams() ?? new URLSearchParams();

  // URL is the source of truth for filters
  const urlSearch = sp.get("search") ?? "";
  const category = sp.get("category") ?? "";
  const rawSort = sp.get("sort");
  const sort = SORTS.some((s) => s.value === rawSort) ? (rawSort as string) : "newest";
  const inStock = sp.get("inStock") === "1" || sp.get("inStock") === "true";
  const minPrice = cleanNum(sp.get("minPrice") ?? "");
  const maxPrice = cleanNum(sp.get("maxPrice") ?? "");

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(window.location.search);
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  /* ---------- search box (debounced into the URL) ---------- */
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [syncedSearch, setSyncedSearch] = useState(urlSearch);
  if (urlSearch !== syncedSearch) {
    // URL changed from outside (e.g. navbar search) — reflect it in the box
    setSyncedSearch(urlSearch);
    setSearchInput(urlSearch);
  }
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }, []);
  const onSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setParams({ search: value.trim() || null }), 400);
  };

  /* ---------- categories ---------- */
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  useEffect(() => {
    let cancelled = false;
    shopService
      .getCategories()
      .then((res: { categories?: ShopCategory[] }) => {
        if (!cancelled) setCategories(res?.categories ?? []);
      })
      .catch(() => {
        /* filter chips are optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const activeCategory = categories.find((c) => c.slug === category);

  /* ---------- products ---------- */
  const query = useMemo(
    () =>
      JSON.stringify({
        search: urlSearch || undefined,
        category: category || undefined,
        sort,
        inStock: inStock ? true : undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
      }),
    [urlSearch, category, sort, inStock, minPrice, maxPrice]
  );
  const [attempt, setAttempt] = useState(0);
  const fetchKey = `${query}#${attempt}`;
  const [res, setRes] = useState<Results>(EMPTY);
  const [more, setMore] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });

  useEffect(() => {
    let cancelled = false;
    shopService
      .getProducts({ ...JSON.parse(query), page: 1, limit: PAGE_SIZE })
      .then((r: ProductPage) => {
        if (cancelled) return;
        setRes({
          key: fetchKey,
          products: r?.products ?? [],
          page: r?.page ?? 1,
          pages: r?.pages ?? 1,
          total: r?.total ?? 0,
          error: null,
        });
        setMore({ loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) setRes({ ...EMPTY, key: fetchKey, error: errorMessage(e, "Failed to load products") });
      });
    return () => {
      cancelled = true;
    };
  }, [fetchKey, query]);

  const loading = res.key !== fetchKey;
  const hasMore = !loading && !res.error && res.page < res.pages;

  const loadMore = async () => {
    const key = res.key;
    setMore({ loading: true, error: null });
    try {
      const r: ProductPage = await shopService.getProducts({ ...JSON.parse(query), page: res.page + 1, limit: PAGE_SIZE });
      setRes((prev) => {
        if (prev.key !== key) return prev;
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

  /* ---------- filter sheet (price range) ---------- */
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftMin, setDraftMin] = useState("");
  const [draftMax, setDraftMax] = useState("");
  const [draftStock, setDraftStock] = useState(false);
  const onSheetOpenChange = (open: boolean) => {
    if (open) {
      setDraftMin(minPrice);
      setDraftMax(maxPrice);
      setDraftStock(inStock);
    }
    setSheetOpen(open);
  };
  const applySheet = () => {
    let lo = cleanNum(draftMin);
    let hi = cleanNum(draftMax);
    if (lo && hi && Number(lo) > Number(hi)) [lo, hi] = [hi, lo];
    setParams({ minPrice: lo || null, maxPrice: hi || null, inStock: draftStock ? "1" : null });
    setSheetOpen(false);
  };

  const clearAll = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearchInput("");
    router.replace(sort !== "newest" ? `${pathname}?sort=${sort}` : pathname, { scroll: false });
  };

  type FilterKey = "search" | "category" | "stock" | "price";
  const clearFilter = (k: FilterKey) => {
    if (k === "search") {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      setSearchInput("");
      setParams({ search: null });
    } else if (k === "category") setParams({ category: null });
    else if (k === "stock") setParams({ inStock: null });
    else setParams({ minPrice: null, maxPrice: null });
  };

  const activeFilters: { key: FilterKey; label: string }[] = [];
  if (urlSearch) activeFilters.push({ key: "search", label: `“${urlSearch}”` });
  if (category) activeFilters.push({ key: "category", label: activeCategory?.name ?? category });
  if (inStock) activeFilters.push({ key: "stock", label: "In stock" });
  if (minPrice || maxPrice)
    activeFilters.push({
      key: "price",
      label: minPrice && maxPrice ? `${minPrice} – ${maxPrice}` : minPrice ? `From ${minPrice}` : `Up to ${maxPrice}`,
    });

  const { addToCart, busyId, toast } = useAddToCart();

  const chip = (active: boolean) =>
    `inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
      active ? "bg-ink text-white shadow-lg shadow-black/10" : "bg-white text-ink ring-1 ring-black/5 hover:ring-ink/30"
    }`;

  return (
    <div className="page-container py-6 md:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
        <div className="min-w-0">
          <p className="eyebrow font-space text-emerald-700">Marketplace</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">Shop products</h1>
          <p className="mt-2 text-sm text-black/55 sm:text-base">
            Every purchase is escrow-protected until you confirm delivery
          </p>
        </div>
        {!loading && !res.error && (
          <span className="inline-flex h-10 items-center gap-2 rounded-full bg-ink pl-1.5 pr-4 text-sm font-semibold text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime text-ink">
              <IconShoppingCart className="h-3.5 w-3.5" />
            </span>
            <span className="font-space">{res.total.toLocaleString()}</span>
            {res.total === 1 ? "product" : "products"}
          </span>
        )}
      </div>

      {/* Search + sort + filters */}
      <div className="mb-4 flex flex-col gap-2 rounded-[28px] bg-white p-2 ring-1 ring-black/5 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          <Input
            type="search"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search products"
            className="h-12 w-full rounded-full border-0 bg-cream pl-11 pr-4 text-sm text-ink shadow-none placeholder:text-black/40 transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-lime-dark/60"
          />
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <Select value={sort} onValueChange={(v) => setParams({ sort: v === "newest" ? null : v })}>
            <SelectTrigger
              aria-label="Sort products"
              className="h-12! min-w-0 flex-1 rounded-full border-0 bg-cream px-4 text-sm font-medium text-ink shadow-none lg:w-[210px] lg:flex-none"
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
          <button
            type="button"
            onClick={() => setParams({ inStock: inStock ? null : "1" })}
            aria-pressed={inStock}
            className={`inline-flex h-12 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
              inStock ? "bg-lime text-ink" : "bg-cream text-ink hover:bg-cream-dark"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-md ${
                inStock ? "bg-ink text-lime" : "bg-white ring-1 ring-black/15"
              }`}
            >
              {inStock && <IconCheck className="h-3 w-3" />}
            </span>
            In stock
          </button>
          <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                aria-label="More filters"
                className="h-12 shrink-0 gap-2 rounded-full border-0 bg-ink px-4 font-semibold text-white shadow-none hover:bg-ink-soft hover:text-white sm:px-5"
              >
                <IconFilter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="flex w-[88vw] flex-col gap-0 border-0 bg-white p-0 font-mont sm:max-w-sm">
              <SheetHeader className="border-b border-black/5 p-6">
                <p className="eyebrow font-space text-emerald-700">Refine</p>
                <SheetTitle className="text-2xl font-extrabold tracking-[-0.03em] text-ink">Filter products</SheetTitle>
                <SheetDescription>Narrow results by price and availability</SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-6 overflow-y-auto p-5">
                <div>
                  <Label className="mb-2 block font-space text-[11px] uppercase tracking-widest text-black/45">
                    Price range
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      placeholder="Min"
                      aria-label="Minimum price"
                      value={draftMin}
                      onChange={(e) => setDraftMin(e.target.value)}
                      className="h-12 rounded-2xl border-0 bg-cream px-4 font-space text-sm shadow-none focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-lime-dark/60"
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      placeholder="Max"
                      aria-label="Maximum price"
                      value={draftMax}
                      onChange={(e) => setDraftMax(e.target.value)}
                      className="h-12 rounded-2xl border-0 bg-cream px-4 font-space text-sm shadow-none focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-lime-dark/60"
                    />
                  </div>
                  <p className="mt-2 text-xs text-black/45">Prices are in each store&apos;s own currency.</p>
                </div>
                <div>
                  <Label className="mb-2 block font-space text-[11px] uppercase tracking-widest text-black/45">
                    Availability
                  </Label>
                  <label className="flex h-11 cursor-pointer items-center gap-3 rounded-2xl px-3 text-sm font-medium text-ink transition-colors hover:bg-cream">
                    <input
                      type="checkbox"
                      checked={draftStock}
                      onChange={(e) => setDraftStock(e.target.checked)}
                      className="h-4 w-4 rounded border-black/20 accent-ink"
                    />
                    Only show items in stock
                  </label>
                </div>
              </div>
              <div className="flex gap-2 border-t border-black/5 p-5">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDraftMin("");
                    setDraftMax("");
                    setDraftStock(false);
                  }}
                  className="h-12 flex-1 rounded-full border-2 border-ink/15 font-semibold text-ink hover:border-ink"
                >
                  Reset
                </Button>
                <Button
                  onClick={applySheet}
                  className="h-12 flex-[2] rounded-full bg-ink font-semibold text-white hover:bg-ink-soft"
                >
                  Apply filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:px-0">
          <button type="button" onClick={() => setParams({ category: null })} className={chip(!category)}>
            <IconLayoutGrid className="h-4 w-4" />
            All
          </button>
          {categories
            .filter((c) => c.count > 0 || c.slug === category)
            .map((c) => {
              const active = c.slug === category;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setParams({ category: active ? null : c.slug })}
                  className={chip(active)}
                >
                  {c.name}
                  <span className={`font-space text-[11px] font-normal ${active ? "text-lime" : "text-black/40"}`}>
                    {c.count}
                  </span>
                </button>
              );
            })}
        </div>
      )}

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <span
              key={f.key}
              className="inline-flex h-8 max-w-full items-center gap-1 rounded-full bg-lime/60 pl-3 pr-1 text-xs font-semibold text-ink"
            >
              <span className="truncate">{f.label}</span>
              <button
                type="button"
                onClick={() => clearFilter(f.key)}
                aria-label={`Remove filter ${f.label}`}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-ink/10"
              >
                <IconX className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="h-8 px-2 text-xs font-semibold text-black/55 underline underline-offset-4 hover:text-ink"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results */}
      <section className="mt-6">
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
            title="No products found"
            text={
              activeFilters.length
                ? "Try a different search term or clear your filters."
                : "Sellers haven't listed any products yet. Check back soon."
            }
            action={
              activeFilters.length ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex h-11 items-center rounded-full border-2 border-ink/15 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div
              className={`${PRODUCT_GRID} transition-opacity ${loading ? "pointer-events-none opacity-50" : ""}`}
              aria-busy={loading}
            >
              {res.products.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} busy={busyId === product.id} />
              ))}
            </div>

            {!loading && (
              <div className="mt-8 flex flex-col items-center gap-3">
                <p className="font-space text-[11px] text-black/50">
                  Showing {res.products.length} of {res.total.toLocaleString()}
                </p>
                {more.error && <p className="text-sm text-red-600">{more.error}</p>}
                {hasMore && (
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={more.loading}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
                  >
                    {more.loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {more.loading ? "Loading…" : "Load more"}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </section>
      {toast}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="page-container py-6 md:py-8">
          <div className="mb-8 h-24 w-64 animate-pulse rounded-3xl bg-black/5" />
          <ProductGridSkeleton count={8} />
        </div>
      }
    >
      <ShopPage />
    </Suspense>
  );
}
