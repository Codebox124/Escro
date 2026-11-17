"use client";

import React from "react";
import { motion } from "motion/react";
import {
  ShoppingBag,
  Store,
  Truck,
  Building2,
  ArrowRight,
  Shield,
  TrendingUp,
  Users,
  Zap,
  CheckCircle2,
} from "@/components/icons";

const accentStyles = {
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    check: "text-emerald-500",
    stat: "bg-emerald-50 text-emerald-600",
    hover: "hover:border-emerald-300 hover:shadow-emerald-500/10",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600 ring-amber-100",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    check: "text-amber-500",
    stat: "bg-amber-50 text-amber-600",
    hover: "hover:border-amber-300 hover:shadow-amber-500/10",
  },
  blue: {
    icon: "bg-sky-50 text-sky-600 ring-sky-100",
    badge: "bg-sky-50 text-sky-700 ring-sky-200",
    check: "text-sky-500",
    stat: "bg-sky-50 text-sky-600",
    hover: "hover:border-sky-300 hover:shadow-sky-500/10",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600 ring-violet-100",
    badge: "bg-violet-50 text-violet-700 ring-violet-200",
    check: "text-violet-500",
    stat: "bg-violet-50 text-violet-600",
    hover: "hover:border-violet-300 hover:shadow-violet-500/10",
  },
} as const;

const RoleSelection = () => {
  const roles = [
    {
      id: "customer",
      icon: ShoppingBag,
      title: "Customer",
      subtitle: "Shop with complete protection",
      description:
        "Shop from thousands of verified sellers with complete purchase protection. Your payments are secured in escrow until delivery.",
      stats: "95% satisfaction rate",
      features: [
        "Secure escrow payments",
        "Verified sellers only",
        "Easy returns & refunds",
        "Real-time order tracking",
        "Price match guarantee",
        "24/7 customer support",
      ],
      accent: "emerald" as const,
      badge: "Most Popular",
      statsIcon: Shield,
      cta: "Start Shopping",
    },
    {
      id: "store-owner",
      icon: Store,
      title: "Store Owner",
      subtitle: "Launch & grow your business",
      description:
        "Launch your online store and reach thousands of customers. Get paid securely through our escrow system with zero setup fees.",
      stats: "40% faster growth",
      features: [
        "No-code store builder",
        "Secure escrow payments",
        "Advanced analytics dashboard",
        "AI-powered marketing tools",
        "Inventory management",
        "Bulk order processing",
      ],
      accent: "amber" as const,
      badge: "Zero Fees",
      statsIcon: TrendingUp,
      cta: "Start Selling",
    },
    {
      id: "courier",
      icon: Truck,
      title: "Courier",
      subtitle: "Earn on your schedule",
      description:
        "Earn money delivering packages on your own schedule. Choose your delivery areas and working hours with flexible payouts.",
      stats: "$25+/hour average",
      features: [
        "Flexible schedule",
        "Instant weekly payouts",
        "AI route optimization",
        "Earn per delivery + tips",
        "Insurance coverage",
        "Performance bonuses",
      ],
      accent: "blue" as const,
      badge: "Flexible",
      statsIcon: Zap,
      cta: "Start Delivering",
    },
    {
      id: "agency",
      icon: Building2,
      title: "Agency",
      subtitle: "Scale your operations",
      description:
        "Scale your logistics business by partnering with our platform. Handle bulk orders with API integration and dedicated support.",
      stats: "Enterprise API",
      features: [
        "Bulk order handling",
        "Full API integration",
        "Dedicated account manager",
        "Custom pricing tiers",
        "White-label solutions",
        "Advanced reporting",
      ],
      accent: "violet" as const,
      badge: "Enterprise",
      statsIcon: Users,
      cta: "Partner Now",
    },
  ];

  return (
    <section
      id="sellers"
      className="relative overflow-hidden bg-zinc-50 py-16 md:py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50rem_25rem_at_50%_-10%,rgb(16_185_129/0.08),transparent_70%)]" />

      <div className="page-container relative z-10">
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <span className="mb-4 inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 shadow-sm ring-1 ring-zinc-200">
            Choose your path
          </span>
          <h2 className="font-mont text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
            Find Your <span className="text-emerald-600">Perfect Fit</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-noto text-base leading-relaxed text-zinc-600 sm:text-lg">
            Join thousands of users already thriving on our platform. Select the
            role that fits you best and get started today.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {roles.map((role, i) => {
            const a = accentStyles[role.accent];
            const featured = role.accent === "emerald";
            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: (i % 2) * 0.08 }}
                className={`group relative flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-7 ${
                  featured ? "border-emerald-200 ring-1 ring-emerald-100" : "border-zinc-200"
                } ${a.hover}`}
              >
                {/* Header */}
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 sm:h-14 sm:w-14 sm:rounded-2xl ${a.icon}`}
                    >
                      <role.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-mont text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
                        {role.title}
                      </h3>
                      <p className="text-sm text-zinc-500">{role.subtitle}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${a.badge}`}
                  >
                    {role.badge}
                  </span>
                </div>

                <p className="mb-6 font-noto text-sm leading-relaxed text-zinc-600 sm:text-base">
                  {role.description}
                </p>

                <ul className="mb-6 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
                  {role.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-zinc-700">
                      <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${a.check}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex flex-col gap-4 border-t border-zinc-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${a.stat}`}>
                      <role.statsIcon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-zinc-600">
                      {role.stats}
                    </span>
                  </div>

                  <button
                    className={`group/btn inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 active:scale-[0.98] sm:w-auto ${
                      featured
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                        : "bg-zinc-900 text-white hover:bg-zinc-800"
                    }`}
                  >
                    {role.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RoleSelection;
