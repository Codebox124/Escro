"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, IconSearch, Store } from "@/components/icons";
import { shopService } from "@/services/shop";
import { formatMoney } from "@/lib/money";

type ProductHit = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  store: { name: string; currency: string };
};
type StoreHit = { id: string; name: string; logo: string | null; productCount: number };

/**
 * Marketplace search with live suggestions.
 * Enter → /dashboard/shop?search=…; clicking a suggestion opens the product/store.
 */
export default function SearchBox({
  dark = false,
  size = "md",
  placeholder = "Search products, stores...",
  onNavigate,
}: {
  dark?: boolean;
  size?: "md" | "lg";
  placeholder?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const params = useSearchParams() ?? new URLSearchParams();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Keep the box in sync with the shop page's ?search=
  const urlSearch = pathname === "/dashboard/shop" ? params.get("search") || "" : "";
  const [query, setQuery] = useState(urlSearch);
  const [syncedFrom, setSyncedFrom] = useState(urlSearch);
  if (syncedFrom !== urlSearch) {
    setSyncedFrom(urlSearch);
    setQuery(urlSearch);
  }

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductHit[]>([]);
  const [stores, setStores] = useState<StoreHit[]>([]);
  const [active, setActive] = useState(-1);

  const term = query.trim();

  // Debounced suggestions
  useEffect(() => {
    if (term.length < 2) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const [p, s] = await Promise.all([
          shopService.getProducts({ search: term, limit: 5 }),
          shopService.getStores({ search: term }),
        ]);
        if (cancelled) return;
        setProducts(p?.products || []);
        setStores((s?.stores || []).slice(0, 3));
        setActive(-1);
      } catch {
        if (!cancelled) {
          setProducts([]);
          setStores([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [term]);

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const hits = term.length >= 2 ? [...products.map((p) => ({ type: "product" as const, p })), ...stores.map((s) => ({ type: "store" as const, s }))] : [];
  const hrefFor = (h: (typeof hits)[number]) =>
    h.type === "product" ? `/dashboard/shop/${h.p.id}` : `/dashboard/stores/${h.s.id}`;

  const go = (href: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && hits[active]) return go(hrefFor(hits[active]));
    go(term ? `/dashboard/shop?search=${encodeURIComponent(term)}` : "/dashboard/shop");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(hits.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showPanel = open && term.length >= 2;
  const h = size === "lg" ? "h-12" : "h-10";

  return (
    <div ref={wrapRef} className="relative w-full">
      <form onSubmit={submit} role="search">
        <IconSearch
          className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${
            dark ? "text-white/50" : "text-black/40"
          }`}
        />
        <input
          type="search"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-label="Search the marketplace"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          className={`${h} w-full rounded-full pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2 [&::-webkit-search-cancel-button]:hidden ${
            dark
              ? "bg-white/10 text-white placeholder:text-white/40 focus:ring-lime/50"
              : "bg-white text-ink ring-1 ring-black/5 placeholder:text-black/40 focus:ring-lime-dark/60"
          }`}
        />
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-3xl bg-white text-ink shadow-2xl shadow-black/15 ring-1 ring-black/5"
        >
          {loading && !hits.length ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-2xl bg-cream" />
              ))}
            </div>
          ) : hits.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-black/50">
              No matches for <span className="font-semibold text-ink">“{term}”</span>
            </p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {products.length > 0 && (
                <p className="eyebrow px-3 pb-1 pt-2 font-space text-[10px] text-black/40">Products</p>
              )}
              {hits.map((hit, i) => {
                const selected = i === active;
                const base = `flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors ${
                  selected ? "bg-cream" : "hover:bg-cream/70"
                }`;
                if (hit.type === "product") {
                  return (
                    <Link
                      key={`p-${hit.p.id}`}
                      href={hrefFor(hit)}
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className={base}
                    >
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-cream">
                        {hit.p.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={hit.p.image} alt="" className="h-full w-full object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{hit.p.name}</span>
                        <span className="block truncate text-xs text-black/45">{hit.p.store.name}</span>
                      </span>
                      <span className="shrink-0 font-space text-sm font-bold">
                        {formatMoney(hit.p.price, hit.p.store.currency)}
                      </span>
                    </Link>
                  );
                }
                return (
                  <div key={`s-${hit.s.id}`}>
                    {i === products.length && (
                      <p className="eyebrow px-3 pb-1 pt-3 font-space text-[10px] text-black/40">Stores</p>
                    )}
                    <Link
                      href={hrefFor(hit)}
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className={base}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink text-lime">
                        {hit.s.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={hit.s.logo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Store className="h-5 w-5" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{hit.s.name}</span>
                        <span className="block text-xs text-black/45">
                          {hit.s.productCount} product{hit.s.productCount === 1 ? "" : "s"}
                        </span>
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => go(`/dashboard/shop?search=${encodeURIComponent(term)}`)}
            className="flex w-full items-center justify-between border-t border-black/5 px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-cream"
          >
            <span className="truncate">See all results for “{term}”</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>
        </div>
      )}
    </div>
  );
}
