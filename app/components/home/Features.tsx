"use client";

import React from "react";
import { motion } from "motion/react";
import {
  ShoppingBag,
  Store,
  Truck,
  Building2,
  ArrowRight,
  CheckCircle2,
} from "@/components/icons";

const Features = () => {
  const features = [
    {
      icon: <ShoppingBag className="w-5 h-5" />,
      title: "Shop Now",
      userType: "For Customers",
      description:
        "Browse thousands of products verified by escrow protection.",
      benefits: [
        "100% purchase protection",
        "Real-time order tracking",
        "Easy returns & refunds",
      ],
      iconWrap: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      check: "text-emerald-500",
      featured: true,
    },
    {
      icon: <Store className="w-5 h-5" />,
      title: "Become a Seller",
      userType: "For Store Owners",
      description: "Start your online business with our pro seller dashboard.",
      benefits: [
        "Zero setup fees to start",
        "Advanced analytics dashboard",
        "Secure instant payouts",
      ],
      iconWrap: "bg-amber-50 text-amber-600 ring-amber-100",
      check: "text-amber-500",
      featured: false,
    },
    {
      icon: <Truck className="w-5 h-5" />,
      title: "Join as Courier",
      userType: "For Couriers",
      description: "Earn money on your schedule by delivering packages nearby.",
      benefits: [
        "Flexible working hours",
        "AI-optimized delivery routes",
        "Weekly instant payouts",
      ],
      iconWrap: "bg-sky-50 text-sky-600 ring-sky-100",
      check: "text-sky-500",
      featured: false,
    },
    {
      icon: <Building2 className="w-5 h-5" />,
      title: "Partner with Us",
      userType: "For Agencies",
      description:
        "Scale your logistics business by partnering with our platform.",
      benefits: [
        "Bulk order management",
        "Full API integration",
        "Dedicated account support",
      ],
      iconWrap: "bg-violet-50 text-violet-600 ring-violet-100",
      check: "text-violet-500",
      featured: false,
    },
  ];

  return (
    <section id="features" className="relative overflow-hidden bg-white py-16 md:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      <div className="pointer-events-none absolute -top-40 right-0 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl" />

      <div className="page-container relative z-10">
        {/* Section Header */}
        <div className="mb-12 flex flex-col gap-6 md:mb-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="mb-4 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
              One platform, four roles
            </span>
            <h2 className="font-mont text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
              Built for <span className="text-emerald-600">Everyone.</span>
            </h2>
          </div>
          <p className="max-w-md font-noto text-base leading-relaxed text-zinc-600 sm:text-lg">
            Whether you&apos;re buying, selling, delivering, or managing logistics,
            Escro has the perfect, secure solution for you.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className={`group relative flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-7 ${
                feature.featured
                  ? "border-emerald-200 bg-gradient-to-b from-emerald-50/70 to-white shadow-sm hover:shadow-emerald-500/10"
                  : "border-zinc-200 bg-white shadow-sm hover:border-zinc-300 hover:shadow-zinc-900/5"
              }`}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${feature.iconWrap}`}
                >
                  {feature.icon}
                </div>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                  {feature.userType}
                </span>
              </div>

              <h3 className="mb-2 font-mont text-xl font-bold tracking-tight text-zinc-900">
                {feature.title}
              </h3>
              <p className="mb-6 font-noto text-sm leading-relaxed text-zinc-600">
                {feature.description}
              </p>

              <ul className="mb-7 space-y-2.5">
                {feature.benefits.map((benefit, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-zinc-700"
                  >
                    <CheckCircle2
                      className={`mt-0.5 h-4 w-4 shrink-0 ${feature.check}`}
                    />
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <button
                  className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 active:scale-[0.98] ${
                    feature.featured
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                      : "border border-zinc-200 bg-white text-zinc-900 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
