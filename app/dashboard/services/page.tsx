"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  IconCalendar,
  IconLayoutGrid,
  IconMessage,
  IconSearch,
  IconWallet,
  IconX,
  Loader2,
  ReceiptText,
} from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { servicesService } from "@/services/shop";
import { formatMoney } from "@/lib/money";
import { ProductImage, StateCard, errorMessage } from "../_components/featured-goods";
import {
  SERVICE_GRID,
  ServiceCard,
  ServiceGridSkeleton,
  ServicesErrorState,
  type RequestStatus,
  type ServiceCategory,
  type ServiceItem,
  type ServicePage,
  type ServiceRequestItem,
} from "../_components/featured-services";

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
  services: ServiceItem[];
  page: number;
  pages: number;
  total: number;
  error: string | null;
};

const EMPTY: Results = { key: "", services: [], page: 1, pages: 1, total: 0, error: null };

function ServicesPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const sp = useSearchParams() ?? new URLSearchParams();

  const tab = sp.get("tab") === "requests" ? "requests" : "browse";

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

  const tabBtn = (active: boolean) =>
    `inline-flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 sm:flex-none ${
      active ? "bg-ink text-white shadow-lg shadow-black/10" : "text-ink hover:bg-cream"
    }`;

  return (
    <div className="page-container py-6 md:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
        <div className="min-w-0">
          <p className="eyebrow font-space text-emerald-700">Marketplace</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">Services</h1>
          <p className="mt-2 text-sm text-black/55 sm:text-base">
            Find a professional, send a request and agree the details directly with the provider
          </p>
        </div>
        <div role="tablist" aria-label="Services sections" className="flex w-full gap-1 rounded-full bg-white p-1 ring-1 ring-black/5 sm:w-auto">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "browse"}
            onClick={() => setParams({ tab: null })}
            className={tabBtn(tab === "browse")}
          >
            <IconLayoutGrid className="h-4 w-4" />
            Browse
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "requests"}
            onClick={() => setParams({ tab: "requests" })}
            className={tabBtn(tab === "requests")}
          >
            <ReceiptText className="h-4 w-4" />
            My requests
          </button>
        </div>
      </div>

      {tab === "browse" ? <BrowseServices setParams={setParams} /> : <MyRequests />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Browse                                                                */
/* ------------------------------------------------------------------ */

function BrowseServices({ setParams }: { setParams: (patch: Record<string, string | null>) => void }) {
  const sp = useSearchParams() ?? new URLSearchParams();
  const urlSearch = sp.get("search") ?? "";
  const category = sp.get("category") ?? "";
  const rawSort = sp.get("sort");
  const sort = SORTS.some((s) => s.value === rawSort) ? (rawSort as string) : "newest";

  /* ---------- search box (debounced into the URL) ---------- */
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [syncedSearch, setSyncedSearch] = useState(urlSearch);
  if (urlSearch !== syncedSearch) {
    setSyncedSearch(urlSearch);
    setSearchInput(urlSearch);
  }
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    []
  );
  const onSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setParams({ search: value.trim() || null }), 400);
  };

  /* ---------- categories ---------- */
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  useEffect(() => {
    let cancelled = false;
    servicesService
      .categories()
      .then((res: { categories?: ServiceCategory[] }) => {
        if (!cancelled) setCategories(res?.categories ?? []);
      })
      .catch(() => {
        /* chips are optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const activeCategory = categories.find((c) => c.slug === category);

  /* ---------- services ---------- */
  const query = useMemo(
    () => JSON.stringify({ search: urlSearch || undefined, category: category || undefined, sort }),
    [urlSearch, category, sort]
  );
  const [attempt, setAttempt] = useState(0);
  const fetchKey = `${query}#${attempt}`;
  const [res, setRes] = useState<Results>(EMPTY);
  const [more, setMore] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });

  useEffect(() => {
    let cancelled = false;
    servicesService
      .list({ ...JSON.parse(query), page: 1, limit: PAGE_SIZE })
      .then((r: ServicePage) => {
        if (cancelled) return;
        setRes({
          key: fetchKey,
          services: r?.services ?? [],
          page: r?.page ?? 1,
          pages: r?.pages ?? 1,
          total: r?.total ?? 0,
          error: null,
        });
        setMore({ loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) setRes({ ...EMPTY, key: fetchKey, error: errorMessage(e, "Failed to load services") });
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
      const r: ServicePage = await servicesService.list({ ...JSON.parse(query), page: res.page + 1, limit: PAGE_SIZE });
      setRes((prev) => {
        if (prev.key !== key) return prev;
        const seen = new Set(prev.services.map((s) => s.id));
        return {
          ...prev,
          services: [...prev.services, ...(r?.services ?? []).filter((s) => !seen.has(s.id))],
          page: r?.page ?? prev.page + 1,
          pages: r?.pages ?? prev.pages,
          total: r?.total ?? prev.total,
        };
      });
      setMore({ loading: false, error: null });
    } catch (e) {
      setMore({ loading: false, error: errorMessage(e, "Couldn't load more services") });
    }
  };

  const clearAll = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearchInput("");
    setParams({ search: null, category: null });
  };

  type FilterKey = "search" | "category";
  const clearFilter = (k: FilterKey) => {
    if (k === "search") {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      setSearchInput("");
      setParams({ search: null });
    } else setParams({ category: null });
  };

  const activeFilters: { key: FilterKey; label: string }[] = [];
  if (urlSearch) activeFilters.push({ key: "search", label: `“${urlSearch}”` });
  if (category) activeFilters.push({ key: "category", label: activeCategory?.name ?? category });

  const chip = (active: boolean) =>
    `inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
      active ? "bg-ink text-white shadow-lg shadow-black/10" : "bg-white text-ink ring-1 ring-black/5 hover:ring-ink/30"
    }`;

  return (
    <>
      {/* Search + sort */}
      <div className="mb-4 flex flex-col gap-2 rounded-[28px] bg-white p-2 ring-1 ring-black/5 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          <Input
            type="search"
            placeholder="Search services..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search services"
            className="h-12 w-full rounded-full border-0 bg-cream pl-11 pr-4 text-sm text-ink shadow-none placeholder:text-black/40 transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-lime-dark/60"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setParams({ sort: v === "newest" ? null : v })}>
          <SelectTrigger
            aria-label="Sort services"
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
                  key={c.slug}
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

      <section className="mt-6">
        {loading && res.services.length === 0 ? (
          <ServiceGridSkeleton count={6} />
        ) : res.error && !loading ? (
          <ServicesErrorState title="Couldn't load services" message={res.error} onRetry={() => setAttempt((a) => a + 1)} />
        ) : !loading && res.services.length === 0 ? (
          activeFilters.length ? (
            <StateCard
              icon={<IconSearch className="h-6 w-6" />}
              title="No matching services"
              text="Try a different search term or clear your filters."
              action={
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex h-11 items-center rounded-full border-2 border-ink/15 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink"
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <StateCard
              tone="lime"
              icon={<Briefcase className="h-6 w-6" />}
              title="No services yet"
              text="Providers haven't listed any services yet. Check back soon."
            />
          )
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-space text-[11px] uppercase tracking-widest text-black/45">
                {res.total.toLocaleString()} {res.total === 1 ? "service" : "services"}
              </p>
            </div>
            <div
              className={`${SERVICE_GRID} transition-opacity ${loading ? "pointer-events-none opacity-50" : ""}`}
              aria-busy={loading}
            >
              {res.services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>

            {!loading && (
              <div className="mt-8 flex flex-col items-center gap-3">
                <p className="font-space text-[11px] text-black/50">
                  Showing {res.services.length} of {res.total.toLocaleString()}
                </p>
                {more.error && <p className="text-center text-sm text-red-600">{more.error}</p>}
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
    </>
  );
}

/* ------------------------------------------------------------------ */
/* My requests                                                          */
/* ------------------------------------------------------------------ */

const STATUS_STYLE: Record<RequestStatus, { label: string; className: string; dot: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-800 ring-amber-600/20", dot: "bg-amber-500" },
  accepted: { label: "Accepted", className: "bg-lime text-ink ring-ink/10", dot: "bg-ink" },
  declined: { label: "Declined", className: "bg-red-50 text-red-700 ring-red-600/20", dot: "bg-red-500" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", className: "bg-black/5 text-black/55 ring-black/10", dot: "bg-black/30" },
};

function StatusPill({ status }: { status: RequestStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold ring-1 ${s.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

const fmtDate = (d?: string | null, withYear = true) => {
  if (!d) return "";
  // "YYYY-MM-DD" → treat as a local calendar date
  const date = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00`) : new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) });
};

type RequestsState = { key: number; requests: ServiceRequestItem[]; error: string | null };

function MyRequests() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<RequestsState>({ key: -1, requests: [], error: null });
  const [confirming, setConfirming] = useState<ServiceRequestItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    servicesService
      .myRequests()
      .then((r: { requests?: ServiceRequestItem[] }) => {
        if (!cancelled) setState({ key: attempt, requests: r?.requests ?? [], error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ key: attempt, requests: [], error: errorMessage(e, "Failed to load your requests") });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const loading = state.key !== attempt;

  const openConfirm = (r: ServiceRequestItem) => {
    setCancelError(null);
    setConfirming(r);
  };

  const confirmCancel = async () => {
    if (!confirming) return;
    const id = confirming.id;
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = (await servicesService.cancelRequest(id)) as Partial<ServiceRequestItem> | null;
      setState((prev) => ({
        ...prev,
        requests: prev.requests.map((r) =>
          r.id === id
            ? { ...r, ...(updated && typeof updated === "object" && "id" in updated ? updated : {}), status: "cancelled" }
            : r
        ),
      }));
      setConfirming(null);
    } catch (e) {
      setCancelError(errorMessage(e, "Couldn't cancel this request"));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="surface-card flex animate-pulse gap-4 p-4">
            <div className="h-16 w-16 shrink-0 rounded-2xl bg-cream sm:h-20 sm:w-20" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="h-4 w-1/2 rounded-full bg-black/5" />
              <div className="h-3 w-1/3 rounded-full bg-black/5" />
              <div className="h-3 w-3/4 rounded-full bg-black/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (state.error) {
    return (
      <ServicesErrorState
        title="Couldn't load your requests"
        message={state.error}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    );
  }

  if (state.requests.length === 0) {
    return (
      <StateCard
        tone="lime"
        icon={<ReceiptText className="h-6 w-6" />}
        title="No requests yet"
        text="When you request a service, you can track the provider's response here."
        action={
          <Link
            href="/dashboard/services"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
          >
            Browse services
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
    );
  }

  return (
    <>
      <p className="mb-4 font-space text-[11px] uppercase tracking-widest text-black/45">
        {state.requests.length} {state.requests.length === 1 ? "request" : "requests"}
      </p>
      <ul className="space-y-3">
        {state.requests.map((r) => {
          const currency = r.service?.currency;
          const href = r.service ? `/dashboard/services/${r.service.id}` : null;
          return (
            <li key={r.id} className="surface-card min-w-0 p-3 sm:p-4">
              <div className="flex min-w-0 gap-3 sm:gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-cream sm:h-20 sm:w-20">
                  <ProductImage src={r.service?.image} alt={r.service?.title ?? "Service"} iconClassName="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      {href ? (
                        <Link href={href} className="line-clamp-2 break-words font-bold leading-snug text-ink hover:underline">
                          {r.service?.title}
                        </Link>
                      ) : (
                        <p className="font-bold text-ink">Service unavailable</p>
                      )}
                      {r.service?.providerName && (
                        <p className="mt-0.5 truncate text-xs text-black/50">by {r.service.providerName}</p>
                      )}
                    </div>
                    <StatusPill status={r.status} />
                  </div>

                  <p className="mt-2 line-clamp-3 whitespace-pre-line break-words text-sm text-black/65">{r.message}</p>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-black/55">
                    {r.budget != null && Number(r.budget) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <IconWallet className="h-3.5 w-3.5 shrink-0" />
                        Budget <span className="font-space font-bold text-ink">{formatMoney(r.budget, currency)}</span>
                      </span>
                    )}
                    {r.preferredDate && (
                      <span className="inline-flex items-center gap-1">
                        <IconCalendar className="h-3.5 w-3.5 shrink-0" />
                        Preferred {fmtDate(r.preferredDate)}
                      </span>
                    )}
                    <span className="font-space text-[11px] text-black/40">Sent {fmtDate(r.createdAt)}</span>
                  </div>
                </div>
              </div>

              {r.providerNote && (
                <div className="mt-3 flex gap-2.5 rounded-2xl bg-cream p-3">
                  <IconMessage className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  <div className="min-w-0">
                    <p className="font-space text-[10px] uppercase tracking-widest text-black/45">Provider note</p>
                    <p className="mt-0.5 whitespace-pre-line break-words text-sm text-ink">{r.providerNote}</p>
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Link
                  href={`/dashboard/services/requests/${r.id}`}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
                >
                  <IconMessage className="h-4 w-4 text-lime" />
                  Messages
                </Link>
                {r.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => openConfirm(r)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-red-200 px-4 text-sm font-semibold text-red-700 transition-colors hover:border-red-400 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  >
                    <IconX className="h-4 w-4" />
                    Cancel request
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={!!confirming} onOpenChange={(open) => !open && !cancelling && setConfirming(null)}>
        <DialogContent className="rounded-3xl border-0 bg-white p-6 font-mont">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-[-0.02em] text-ink">Cancel this request?</DialogTitle>
            <DialogDescription>
              {confirming?.service?.title
                ? `Your request for “${confirming.service.title}” will be withdrawn. This can't be undone.`
                : "Your request will be withdrawn. This can't be undone."}
            </DialogDescription>
          </DialogHeader>
          {cancelError && <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{cancelError}</p>}
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={cancelling}
              className="inline-flex h-11 items-center justify-center rounded-full border-2 border-ink/15 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink disabled:opacity-50"
            >
              Keep request
            </button>
            <button
              type="button"
              onClick={confirmCancel}
              disabled={cancelling}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancel request
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="page-container py-6 md:py-8">
          <div className="mb-8 h-24 w-64 max-w-full animate-pulse rounded-3xl bg-black/5" />
          <ServiceGridSkeleton count={6} />
        </div>
      }
    >
      <ServicesPage />
    </Suspense>
  );
}
