"use client";

import React from "react";
import { motion } from "motion/react";
import {
  Search,
  ShoppingCart,
  Package,
  Store,
  Upload,
  TrendingUp,
  ArrowRight,
  Users,
  Shield,
  Zap,
} from "@/components/icons";

const HowItWorks = () => {
  // Consolidated data-driven configuration

  const workflows = [
    {
      id: "customers",
      title: "For Customers",
      subtitle: "Shop with confidence in three simple steps",
      accent: "emerald",
      steps: [
        {
          number: "01",
          icon: <Search className="w-5 h-5" />,
          title: "Browse & Select",
          description:
            "Explore thousands of products from verified sellers. Find exactly what you need with our advanced search and filters.",
          highlight:
            "Advanced filters and verified seller badges ensure quality.",
        },
        {
          number: "02",
          icon: <ShoppingCart className="w-5 h-5" />,
          title: "Secure Checkout",
          description:
            "Your payment is held safely in escrow. Funds are only released when you confirm delivery and satisfaction.",
          highlight: "100% escrow protection with real-time tracking.",
        },
        {
          number: "03",
          icon: <Package className="w-5 h-5" />,
          title: "Receive & Confirm",
          description:
            "Get your items delivered to your doorstep. Confirm receipt and release payment with complete peace of mind.",
          highlight: "Instant payment release upon confirmation.",
        },
      ],
    },
    {
      id: "vendors",
      title: "For Vendors",
      subtitle: "Start selling in three simple steps",
      accent: "amber",
      steps: [
        {
          number: "01",
          icon: <Store className="w-5 h-5" />,
          title: "Create Your Store",
          description:
            "Set up your seller account in minutes. Customize your storefront and start building your brand online.",
          highlight: "No-code store builder with customizable themes.",
        },
        {
          number: "02",
          icon: <Upload className="w-5 h-5" />,
          title: "List Your Products",
          description:
            "Upload products with photos and descriptions. Set your prices and manage inventory from one dashboard.",
          highlight: "Batch upload and AI-powered descriptions.",
        },
        {
          number: "03",
          icon: <TrendingUp className="w-5 h-5" />,
          title: "Sell & Grow",
          description:
            "Receive orders and fulfill them securely. Get paid instantly when customers confirm delivery via escrow.",
          highlight: "Automated payouts and growth analytics.",
        },
      ],
    },
  ];

  // Stats configuration
  const stats = [
    { icon: Users, value: "500+", label: "Active Users" },
    { icon: Shield, value: "100%", label: "Escrow Protected" },
    { icon: Zap, value: "< 2min", label: "Avg. Setup Time" },
  ];

  return (
    <section
      className="relative overflow-hidden bg-zinc-950 py-16 md:py-24"
      id="HowItWorks"
    >
      {/* Background Atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_40%,transparent_100%)]" />
        <div className="absolute -left-40 top-1/4 h-[480px] w-[480px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -right-40 bottom-1/4 h-[480px] w-[480px] rounded-full bg-amber-500/[0.07] blur-[120px]" />
      </div>

      <div className="page-container relative z-10">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <span className="mb-4 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            Simple & secure
          </span>
          <h2 className="font-mont text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            How It <span className="text-gradient-brand">Works</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-noto text-base text-zinc-400 sm:text-lg">
            Money only moves when everyone is happy. Here&apos;s how escrow keeps
            every order safe.
          </p>

          <dl className="mx-auto mt-8 grid max-w-xl grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03] py-4 backdrop-blur-sm">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse items-center gap-1 px-2">
                <dt className="text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-xs">
                  {stat.label}
                </dt>
                <dd className="flex items-center gap-1.5 font-mont text-lg font-bold text-white sm:text-2xl">
                  <stat.icon className="hidden h-4 w-4 text-emerald-400 sm:block" />
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Workflow Sections */}
        <div className="space-y-16 md:space-y-20">
          {workflows.map((workflow) => {
            const isEmerald = workflow.accent === "emerald";
            return (
              <div key={workflow.id}>
                {/* Workflow header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="font-mont text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {workflow.title}
                    </h3>
                    <p className="mt-1.5 font-noto text-zinc-400">
                      {workflow.subtitle}
                    </p>
                  </div>
                  <button
                    className={`group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] sm:w-auto ${
                      isEmerald
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                        : "border border-white/10 bg-white/5 text-white hover:border-amber-400/40 hover:bg-white/10"
                    }`}
                  >
                    {workflow.id === "customers"
                      ? "Start Shopping"
                      : "Start Selling"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                {/* Steps Grid */}
                <ol className="relative grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5 lg:gap-6">
                  {/* Connecting line - md+ */}
                  <div
                    aria-hidden
                    className={`pointer-events-none absolute left-[16%] right-[16%] top-[42px] hidden h-px bg-gradient-to-r md:block ${
                      isEmerald
                        ? "from-emerald-500/0 via-emerald-500/40 to-emerald-500/0"
                        : "from-amber-500/0 via-amber-500/40 to-amber-500/0"
                    }`}
                  />

                  {workflow.steps.map((step, index) => (
                    <motion.li
                      key={step.number}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.45, delay: index * 0.08 }}
                      className={`group relative flex flex-col rounded-2xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 sm:p-6 lg:p-7 ${
                        isEmerald
                          ? "hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/10"
                          : "hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/10"
                      }`}
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <span
                          className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-xl font-mont text-sm font-bold text-white shadow-lg ${
                            isEmerald
                              ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30"
                              : "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30"
                          }`}
                        >
                          {step.number}
                        </span>
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/60 ${
                            isEmerald ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {step.icon}
                        </span>
                      </div>

                      <h4 className="mb-2 font-mont text-lg font-bold text-white sm:text-xl">
                        {step.title}
                      </h4>
                      <p className="mb-5 font-noto text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
                        {step.description}
                      </p>

                      <div className="mt-auto flex items-start gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] p-3.5">
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                            isEmerald ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                        />
                        <span className="text-sm text-zinc-300">
                          {step.highlight}
                        </span>
                      </div>
                    </motion.li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
