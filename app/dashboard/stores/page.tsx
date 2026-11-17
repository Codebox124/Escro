"use client";

/* eslint-disable @next/next/no-img-element -- store banners/logos come from arbitrary hosts */

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconSearch, IconShieldCheck, IconStar, IconBuildingStore, IconCircleCheck } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { shopService } from "@/services/shop";
import {
  RetryButton,
  StateCard,
  errorMessage,
  initials,
  useDebounced,
  type ShopStore,
} from "../_components/featured-goods";

type State = { key: string; stores: ShopStore[]; error: string | null };

const Page = () => {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput.trim(), 400);
  const [attempt, setAttempt] = useState(0);
  const key = `${search}#${attempt}`;
  const [state, setState] = useState<State>({ key: "", stores: [], error: null });

  useEffect(() => {
    let cancelled = false;
    shopService
      .getStores(search ? { search } : {})
      .then((r: { stores?: ShopStore[] }) => {
        if (!cancelled) setState({ key, stores: r?.stores ?? [], error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ key, stores: [], error: errorMessage(e, "Failed to load stores") });
      });
    return () => {
      cancelled = true;
    };
  }, [key, search]);

  const loading = state.key !== key;
  const { stores, error } = state;

  return (
    <div className="page-container py-6 md:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
        <div className="min-w-0">
          <p className="eyebrow font-space text-emerald-700">Sellers</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">Explore stores</h1>
          <p className="mt-2 text-sm text-black/55 sm:text-base">
            Shop directly from sellers — every order is escrow-protected
          </p>
        </div>
        {!loading && !error && (
          <span className="inline-flex h-10 items-center gap-2 rounded-full bg-ink pl-1.5 pr-4 text-sm font-semibold text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime text-ink">
              <IconBuildingStore className="h-3.5 w-3.5" />
            </span>
            <span className="font-space">{stores.length.toLocaleString()}</span>
            {stores.length === 1 ? "store" : "stores"}
          </span>
        )}
      </div>

      <div className="mb-8 rounded-[28px] bg-white p-2 ring-1 ring-black/5">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          <Input
            type="search"
            placeholder="Search stores..."
            aria-label="Search stores"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-12 w-full rounded-full border-0 bg-cream pl-11 pr-4 text-sm text-ink shadow-none placeholder:text-black/40 transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-lime-dark/60"
          />
        </div>
      </div>

      {loading && stores.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="animate-pulse rounded-3xl bg-white p-2 ring-1 ring-black/5">
              <div className="h-32 rounded-2xl bg-cream" />
              <div className="px-3 pb-3">
                <div className="-mt-7 mb-3 h-14 w-14 rounded-2xl border-4 border-white bg-black/5" />
                <div className="h-4 w-1/2 rounded-full bg-black/5" />
                <div className="mt-2 h-3 w-3/4 rounded-full bg-black/5" />
                <div className="mt-5 h-3 w-1/3 rounded-full bg-black/5" />
              </div>
            </div>
          ))}
        </div>
      ) : error && !loading ? (
        <StateCard
          tone="error"
          icon={<IconBuildingStore className="h-6 w-6" />}
          title="Couldn't load stores"
          text={error}
          action={<RetryButton onClick={() => setAttempt((a) => a + 1)} />}
        />
      ) : !loading && stores.length === 0 ? (
        <StateCard
          icon={<IconBuildingStore className="h-6 w-6" />}
          title="No stores found"
          text={search ? "Try a different search term." : "No sellers have opened a store yet."}
        />
      ) : (
        <div
          className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 ${
            loading ? "pointer-events-none opacity-50" : ""
          }`}
          aria-busy={loading}
        >
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </div>
  );
};

function StoreCard({ store }: { store: ShopStore }) {
  const rating = Number(store.rating) || 0;
  return (
    <Link
      href={`/dashboard/stores/${store.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-3xl bg-white p-2 ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgba(12,17,14,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
    >
      <div className="relative h-32 overflow-hidden rounded-2xl bg-ink sm:h-36">
        {store.banner ? (
          <>
            <img
              src={store.banner}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-ink/50 to-transparent" />
          </>
        ) : (
          <>
            <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-lime/25 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 left-6 h-32 w-32 rounded-full bg-emerald-500/25 blur-2xl" />
          </>
        )}
        {store.verified && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-1 text-[10px] font-bold text-ink">
            <IconCircleCheck className="h-3 w-3" />
            Verified
          </span>
        )}
      </div>
      <div className="relative flex flex-1 flex-col px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="-mt-8 mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-cream font-space text-lg font-bold text-ink shadow-md">
          {store.logo ? <img src={store.logo} alt="" className="h-full w-full object-cover" /> : initials(store.name)}
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="truncate text-base font-extrabold tracking-tight text-ink sm:text-lg">{store.name}</h3>
          {store.verified && <IconShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />}
        </div>
        {(store.tagline || store.description) && (
          <p className="mt-1 line-clamp-2 text-sm text-black/55">{store.tagline || store.description}</p>
        )}
        <div className="min-h-4 flex-1" />
        <div className="flex items-center justify-between gap-2 border-t border-black/5 pt-4">
          <span className="text-sm text-black/55">
            <strong className="font-space font-bold text-ink">{(store.productCount ?? 0).toLocaleString()}</strong>{" "}
            {store.productCount === 1 ? "product" : "products"}
          </span>
          {rating > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-2.5 py-1">
              <IconStar className="h-3.5 w-3.5 fill-lime text-lime" />
              <span className="font-space text-xs font-bold text-white">{rating.toFixed(1)}</span>
              <span className="font-space text-[10px] text-white/50">({store.reviews})</span>
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-cream px-2.5 py-1 font-space text-[11px] text-black/50">New</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default Page;
