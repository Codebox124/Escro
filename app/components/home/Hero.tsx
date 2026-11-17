"use client";

import React from "react";
import HeroImage from "@/public/hero.svg";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  ShieldCheck,
  TrendingUp,
  Users,
} from "@/components/icons";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const Hero = () => {
  return (
    <section
      id="home"
      className="relative w-full overflow-hidden bg-zinc-950 selection:bg-[#10B981] selection:text-white"
    >
      <div className="pointer-events-none absolute inset-0 z-0 opacity-20 mix-blend-overlay">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <filter id="noiseFilter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.6"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#10B981] opacity-20 blur-[120px] sm:h-[560px] sm:w-[560px] lg:left-1/4" />
      <div className="pointer-events-none absolute -bottom-48 -right-24 h-[420px] w-[420px] rounded-full bg-emerald-900 opacity-30 blur-[100px] sm:h-[600px] sm:w-[600px]" />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="page-container relative z-10 pt-28 pb-16 sm:pt-32 md:pb-24 lg:pt-36 lg:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10 xl:gap-16">
          <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 sm:text-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Escrow-protected payments on every order
            </motion.div>

            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mb-6 font-mont text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              Your One-Stop{" "}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[#10B981] via-emerald-200 to-white bg-clip-text text-transparent">
                Multi-Vendor
              </span>{" "}
              Marketplace.
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mb-8 max-w-lg font-noto text-base leading-relaxed text-zinc-400 sm:text-lg md:text-xl lg:mx-0 lg:mb-10"
            >
              The modern marketplace where your funds are protected until
              delivery is confirmed. Built for buyers, sellers, and secure
              transactions.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4 lg:justify-start"
            >
              <button className="group relative inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#10B981] px-7 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-[#059669] hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] sm:h-14 sm:px-8 sm:text-lg">
                Shop Now
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/50 px-7 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] sm:h-14 sm:px-8 sm:text-lg">
                Become a Seller
              </button>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium text-zinc-400 lg:justify-start"
            >
              <a
                href="#"
                className="group inline-flex items-center gap-1.5 py-1 transition-colors hover:text-[#10B981]"
              >
                Join as Courier
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <span className="text-zinc-700" aria-hidden>
                •
              </span>
              <a
                href="#"
                className="group inline-flex items-center gap-1.5 py-1 transition-colors hover:text-[#10B981]"
              >
                Agency Partnerships
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </motion.div>

            <motion.dl
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-10 grid grid-cols-3 gap-3 border-t border-zinc-800/80 pt-8 sm:gap-6 lg:mt-12"
            >
              {[
                { label: "Active Users", val: "10K+", icon: Users },
                { label: "Escrow Secure", val: "100%", icon: ShieldCheck },
                { label: "Trust Rating", val: "4.9/5", icon: TrendingUp },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 lg:items-start"
                >
                  <dt className="order-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-xs">
                    <stat.icon className="hidden h-3.5 w-3.5 text-emerald-500 sm:block" />
                    {stat.label}
                  </dt>
                  <dd className="order-1 font-mont text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                    {stat.val}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative mx-auto w-full max-w-xl lg:max-w-none"
          >
            <div className="relative z-20 rounded-2xl border border-white/10 bg-zinc-900/40 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-b from-[#10B981] to-transparent opacity-20 blur-sm" />

              <div className="relative overflow-hidden rounded-xl bg-zinc-900">
                <img
                  src={HeroImage.src}
                  alt="Marketplace Dashboard"
                  className="h-auto w-full object-cover"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 transition-opacity duration-500 hover:opacity-100" />
              </div>
            </div>

            {/* Floating trust chips */}
            <div className="absolute -bottom-5 left-3 z-30 hidden items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/90 px-4 py-3 shadow-xl backdrop-blur-xl sm:flex lg:-left-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <Lock className="h-4 w-4" />
              </span>
              <span className="text-left">
                <span className="block text-xs text-zinc-400">Held in escrow</span>
                <span className="block font-mont text-sm font-bold text-white">
                  ₦245,000.00
                </span>
              </span>
            </div>
            <div className="absolute -top-4 right-3 z-30 hidden items-center gap-2 rounded-full border border-white/10 bg-zinc-900/90 px-3 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur-xl sm:flex lg:-right-4">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Delivery confirmed
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
