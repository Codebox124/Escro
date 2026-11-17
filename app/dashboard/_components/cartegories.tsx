"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconDeviceLaptop,
  IconDeviceMobile,
  IconShirt,
  IconSofa,
  IconBarbell,
  IconBook,
  IconDeviceGamepad2,
  IconToolsKitchen2,
  IconSparkles,
  IconArrowRight,
  IconArrowUpRight,
  IconLayoutGrid,
  IconTag,
  IconCamera,
  IconGift,
  Car,
  IconPalette,
} from "@/components/icons";
import { shopService } from "@/services/shop";
import { errorMessage, type ShopCategory } from "./featured-goods";

type IconType = React.ComponentType<{ className?: string }>;

/** Best-effort icon for a category by keywords in its slug/name. */
const ICON_RULES: [RegExp, IconType][] = [
  [/phone|mobile|tablet/, IconDeviceMobile],
  [/electr|laptop|computer|tech|gadget/, IconDeviceLaptop],
  [/fashion|cloth|apparel|wear|shoe|footwear/, IconShirt],
  [/home|furniture|living|decor/, IconSofa],
  [/sport|fitness|gym|outdoor/, IconBarbell],
  [/book|station/, IconBook],
  [/gam|toy/, IconDeviceGamepad2],
  [/food|grocer|kitchen|drink/, IconToolsKitchen2],
  [/camera|photo/, IconCamera],
  [/gift|craft/, IconGift],
  [/auto|car|vehicle/, Car],
  [/beauty|art|cosmetic|health/, IconPalette],
];

function iconFor(c: ShopCategory): IconType {
  const key = `${c.slug} ${c.name}`.toLowerCase();
  return ICON_RULES.find(([re]) => re.test(key))?.[1] ?? IconTag;
}

const chipCls =
  "group inline-flex h-11 shrink-0 snap-start items-center gap-2 rounded-full bg-white pl-1.5 pr-4 text-sm font-semibold text-ink ring-1 ring-black/5 transition-all hover:ring-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60";
const iconCls =
  "flex h-8 w-8 items-center justify-center rounded-full bg-cream text-ink transition-colors group-hover:bg-lime";

type State = { key: number; categories: ShopCategory[]; error: string | null };

const Categories = () => {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ key: -1, categories: [], error: null });

  useEffect(() => {
    let cancelled = false;
    shopService
      .getCategories()
      .then((res: { categories?: ShopCategory[] }) => {
        if (!cancelled) setState({ key: attempt, categories: res?.categories ?? [], error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ key: attempt, categories: [], error: errorMessage(e, "Couldn't load categories") });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const loading = state.key !== attempt;
  const categories = state.categories.filter((c) => (c.count ?? 0) > 0);

  return (
    <section className="pt-10 md:pt-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
        <div className="min-w-0">
          <p className="eyebrow font-space text-emerald-700">Browse</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl">
            Explore categories
          </h2>
          <p className="mt-1 text-sm text-black/55">Jump straight to what you&apos;re looking for</p>
        </div>
        <Link
          href="/dashboard/shop"
          className="group inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border-2 border-ink/15 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
        >
          View all
          <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Category chips: horizontally scrollable on phones, wrap from sm */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {loading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-11 w-28 shrink-0 animate-pulse rounded-full bg-black/5 sm:w-32" />
          ))
        ) : state.error ? (
          <p className="flex items-center gap-3 text-sm text-black/55">
            {state.error}.
            <button
              type="button"
              onClick={() => setAttempt((a) => a + 1)}
              className="font-semibold text-ink underline underline-offset-4 hover:no-underline"
            >
              Retry
            </button>
          </p>
        ) : (
          <>
            <Link href="/dashboard/shop" className={`${chipCls} bg-ink! text-white! shadow-lg shadow-black/10`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink">
                <IconLayoutGrid className="h-4 w-4" />
              </span>
              All products
            </Link>
            {categories.map((category) => {
              const Icon = iconFor(category);
              return (
                <Link
                  key={category.id}
                  href={`/dashboard/shop?category=${encodeURIComponent(category.slug)}`}
                  className={chipCls}
                >
                  <span className={iconCls}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="whitespace-nowrap">{category.name}</span>
                  <span className="font-space text-[11px] font-normal text-black/40">
                    {category.count.toLocaleString()}
                  </span>
                </Link>
              );
            })}
          </>
        )}
      </div>

      {/* New arrivals banner */}
      <div className="relative mt-6 overflow-hidden rounded-3xl bg-lime p-5 text-ink sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/30 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-lime">
              <IconSparkles className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-extrabold tracking-tight sm:text-xl">Discover new arrivals</h3>
              <p className="text-sm text-ink/65">See the most recently listed products first</p>
            </div>
          </div>
          <Link
            href="/dashboard/shop?sort=newest"
            className="group inline-flex h-12 w-full items-center justify-between gap-2 rounded-full bg-ink pl-5 pr-1.5 text-sm font-semibold text-white transition-colors hover:bg-ink-soft sm:w-auto"
          >
            Explore new arrivals
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-ink transition-transform duration-300 group-hover:rotate-45">
              <IconArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Categories;
