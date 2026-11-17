"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Bike, Building2, Check, ShoppingBag, Store } from "@/components/icons";
import { platformApi } from "@/services/admin";

type PlatformStats = Record<"products" | "stores" | "couriers" | "agencies", number>;

const formatCount = (n: number) =>
  new Intl.NumberFormat("en-NG", { notation: n >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);

const roles: {
  key: string; img: string; label: string; icon: React.ElementType; bg: string; headline: string;
  points: string[]; stat: { key: keyof PlatformStats; one: string; many: string }; cta: string;
}[] = [
  {
    key: "buyer",
    img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80&auto=format&fit=crop",
    label: "Buyers",
    icon: ShoppingBag,
    bg: "bg-[#C8F169]",
    headline: "Shop from strangers like they're old friends.",
    points: [
      "Money held until you confirm delivery",
      "Full refund if the item isn't as described",
      "Live tracking from store to door",
      "One cart across many vendors",
    ],
    stat: { key: "products", one: "product ready to order with escrow protection", many: "products ready to order with escrow protection" },
    cta: "Start shopping",
  },
  {
    key: "seller",
    img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80&auto=format&fit=crop",
    label: "Sellers",
    icon: Store,
    bg: "bg-emerald-500",
    headline: "Sell to anyone, anywhere, with guaranteed payment.",
    points: [
      "See funds secured before you ship",
      "Your own storefront and dashboard",
      "Payout the moment buyers confirm",
      "Protection against fake chargebacks",
    ],
    stat: { key: "stores", one: "store already selling on Escro", many: "stores already selling on Escro" },
    cta: "Open your store",
  },
  {
    key: "courier",
    img: "https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=1200&q=80&auto=format&fit=crop",
    label: "Couriers",
    icon: Bike,
    bg: "bg-amber-400",
    headline: "Deliver on your schedule. Get paid every drop.",
    points: [
      "Pick jobs near you from a live map",
      "Earnings released on delivery",
      "Weekly payouts straight to your bank",
      "Ratings that grow your income",
    ],
    stat: { key: "couriers", one: "courier delivering with Escro", many: "couriers delivering with Escro" },
    cta: "Ride with Escro",
  },
  {
    key: "agency",
    img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80&auto=format&fit=crop",
    label: "Agencies",
    icon: Building2,
    bg: "bg-sky-400",
    headline: "Run your logistics fleet on Escro's rails.",
    points: [
      "Manage agents and projects in one place",
      "Assign deliveries across your team",
      "Transparent per-job revenue",
      "Dispute support built in",
    ],
    stat: { key: "agencies", one: "agency already onboard", many: "agencies already onboard" },
    cta: "Partner with us",
  },
];

export default function Roles() {
  const [active, setActive] = useState(0);
  // Live counts from the database (null while loading / if unavailable)
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    platformApi
      .stats()
      .then((d: PlatformStats | null) => {
        if (!cancelled && d) setStats(d);
      })
      .catch(() => {
        /* keep the placeholder */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const r = roles[active];

  return (
    <section id="roles" className="bg-[#F4F1EA] py-20 sm:py-28">
      <div className="page-container">
        <div className="text-center">
          <p className="font-space text-sm uppercase tracking-widest text-emerald-700">Who it&apos;s for</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-extrabold leading-[1] tracking-[-0.03em] text-[#0C110E] sm:text-5xl lg:text-6xl">
            One platform. Four ways to win.
          </h2>
        </div>

        {/* tabs */}
        <div className="mt-10 flex justify-center">
          <div
            role="tablist"
            className="scrollbar-hide flex max-w-full gap-1 overflow-x-auto rounded-full bg-white p-1.5 ring-1 ring-black/5"
          >
            {roles.map((role, i) => (
              <button
                key={role.key}
                role="tab"
                aria-selected={active === i}
                onClick={() => setActive(i)}
                className="relative flex h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-bold sm:px-5 sm:text-sm"
              >
                {active === i && (
                  <motion.span
                    layoutId="role-pill"
                    className="absolute inset-0 rounded-full bg-[#0C110E]"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <role.icon
                  className={`relative hidden h-4 w-4 transition-colors sm:block ${
                    active === i ? "text-[#C8F169]" : "text-black/50"
                  }`}
                />
                <span
                  className={`relative transition-colors ${active === i ? "text-white" : "text-black/60"}`}
                >
                  {role.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={r.key}
            role="tabpanel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="mt-10 grid overflow-hidden rounded-[32px] bg-white ring-1 ring-black/5 lg:grid-cols-[1.3fr_1fr]"
          >
            <div className="p-6 sm:p-10 lg:p-12">
              <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-[#0C110E] sm:text-4xl">
                {r.headline}
              </h3>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {r.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 rounded-2xl bg-[#F4F1EA] p-4">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0C110E]">
                      <Check className="h-3 w-3 text-[#C8F169]" strokeWidth={3} />
                    </span>
                    <span className="text-sm font-medium text-black/75">{p}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="group mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#0C110E] px-7 font-bold text-white transition-transform hover:scale-[1.02] sm:w-auto"
              >
                {r.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="relative min-h-[320px] overflow-hidden bg-ink lg:min-h-[460px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.img}
                alt={`Escro for ${r.label.toLowerCase()}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
              <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 font-space text-xs font-bold uppercase tracking-widest text-ink backdrop-blur sm:left-8 sm:top-8">
                For {r.label.toLowerCase()}
              </span>
              <div className={`absolute bottom-5 left-5 right-5 rounded-3xl p-5 sm:bottom-8 sm:left-8 sm:right-auto sm:max-w-xs ${r.bg}`}>
                <p className="font-space text-5xl font-bold tracking-tighter text-ink sm:text-6xl">
                  {stats ? formatCount(stats[r.stat.key]) : <span className="inline-block h-[0.9em] w-16 animate-pulse rounded-lg bg-ink/15 align-middle" />}
                </p>
                <p className="mt-1 font-semibold text-ink/75">{stats && stats[r.stat.key] === 1 ? r.stat.one : r.stat.many}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
