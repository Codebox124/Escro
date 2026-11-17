"use client";

import { useEffect, useState } from "react";
import type React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  Check,
  CreditCard,
  Lock,
  PackageCheck,
  Star,
  Wallet,
} from "@/components/icons";

const stages = [
  { icon: CreditCard, label: "Buyer pays", detail: "Card • $240.00", tone: "Payment received" },
  { icon: Lock, label: "Locked in vault", detail: "Seller can't touch it yet", tone: "Funds secured" },
  { icon: Bike, label: "Out for delivery", detail: "Courier is 2.4 km away", tone: "In transit" },
  { icon: PackageCheck, label: "Buyer confirms", detail: "Item matches the listing", tone: "Delivered" },
  { icon: Wallet, label: "Seller gets paid", detail: "Released instantly", tone: "Complete" },
];

function EscrowDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % stages.length), 2200);
    return () => clearInterval(id);
  }, []);

  const current = stages[step];
  const released = step === stages.length - 1;

  return (
    <div className="relative mx-auto w-full">
      {/* floating chips */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-4 right-4 z-20 hidden items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-[#0C110E] shadow-xl shadow-black/10 ring-1 ring-black/5 sm:flex"
      >
        <BadgeCheck className="h-4 w-4 text-emerald-600" /> Verified seller
      </motion.div>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-4 bottom-20 z-20 hidden items-center gap-1.5 rounded-2xl bg-[#C8F169] px-3 py-2 text-xs font-bold text-[#0C110E] shadow-xl shadow-black/10 sm:flex"
      >
        <Star className="h-3.5 w-3.5 fill-current" /> 4.9 buyer rating
      </motion.div>

      <div className="relative overflow-hidden rounded-[28px] bg-ink p-3 text-white shadow-[0_40px_80px_-30px_rgba(12,17,14,0.55)] ring-1 ring-black/5">
        {/* product photo header */}
        <div className="relative h-28 overflow-hidden rounded-[20px] bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=75&auto=format&fit=crop"
            alt="Red running sneaker"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
          <div className="absolute inset-x-4 bottom-3 flex items-end justify-between">
            <div>
              <p className="text-sm font-bold">Air Runner Sneakers</p>
              <p className="font-space text-[11px] text-white/60">ORDER #ESC-20481</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-space text-[10px] uppercase tracking-wider text-white backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
              Live
            </span>
          </div>
        </div>

        <div className="px-3 pb-3 pt-5 sm:px-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-space text-[11px] uppercase tracking-widest text-white/45">In escrow</p>
              <p className="mt-1 font-space text-4xl font-bold tracking-tight sm:text-5xl">$240.00</p>
            </div>
            <motion.div
              key={released ? "open" : "locked"}
              initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                released ? "bg-lime text-ink" : "bg-white/[0.08] text-lime ring-1 ring-white/10"
              }`}
            >
              {released ? <Wallet className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
            </motion.div>
          </div>

          {/* segmented progress */}
          <div className="mt-5 grid grid-cols-5 gap-1.5">
            {stages.map((s, i) => (
              <div key={s.label} className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-lime"
                  initial={false}
                  animate={{ width: i <= step ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            ))}
          </div>

          <ol className="mt-4 space-y-1">
            {stages.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li
                  key={s.label}
                  className={`flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors duration-500 ${
                    active ? "bg-white/[0.06] ring-1 ring-white/10" : ""
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-500 ${
                      active
                        ? "bg-lime text-ink"
                        : done
                        ? "bg-white/10 text-white"
                        : "bg-white/[0.04] text-white/25"
                    }`}
                  >
                    <s.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold transition-colors ${
                        active ? "text-white" : done ? "text-white/70" : "text-white/30"
                      }`}
                    >
                      {s.label}
                    </p>
                    {active && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="truncate text-xs text-white/50"
                      >
                        {s.detail}
                      </motion.p>
                    )}
                  </div>
                  {done && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime text-ink">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
            <span className="font-space uppercase tracking-widest text-white/45">Status</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={current.tone}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-full bg-lime px-3 py-1 font-bold text-ink"
              >
                {current.tone}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-[#F4F1EA] pb-16 pt-28 sm:pt-36 lg:pb-24">
      {/* subtle dotted backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#0C110E14_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

      <div className="page-container relative grid items-center gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
        <div>
          <div
            style={d(0)}
            className="anim-focus inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#0C110E] ring-1 ring-black/5"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Escrow-protected marketplace
          </div>

          <h1 className="mt-6 text-[2.75rem] font-extrabold leading-[0.95] tracking-[-0.04em] text-[#0C110E] sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
            <span className="line-mask">
              <span className="anim-rise" style={d(80)}>
                Buy from anyone.
              </span>
            </span>
            <span className="line-mask">
              <span className="anim-rise" style={d(200)}>
                Pay when it{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 italic">arrives.</span>
                  <svg
                    className="absolute -bottom-1 left-0 z-0 h-4 w-full sm:h-5"
                    viewBox="0 0 200 20"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <motion.path
                      d="M2 14 C 50 4, 120 4, 198 12"
                      fill="none"
                      stroke="#C8F169"
                      strokeWidth="10"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.9, duration: 0.8, ease: "easeInOut" }}
                    />
                  </svg>
                </span>
              </span>
            </span>
          </h1>

          <p
            style={d(380)}
            className="anim-focus mt-6 max-w-xl text-base leading-relaxed text-black/60 sm:text-lg"
          >
            Escro holds your money in a secure vault until your order lands in your hands.
            Sellers get guaranteed payment, couriers get paid on delivery, and nobody gets
            scammed.
          </p>

          <div style={d(480)} className="anim-focus mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#0C110E] px-7 text-base font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Start shopping safely
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C8F169] text-[#0C110E] transition-transform group-hover:translate-x-1">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-14 items-center justify-center rounded-full border-2 border-[#0C110E]/15 px-7 text-base font-bold text-[#0C110E] transition-colors hover:border-[#0C110E] hover:bg-white"
            >
              Open a store
            </Link>
          </div>

          <div style={d(580)} className="anim-focus mt-10 flex items-center gap-4">
            <div className="flex -space-x-2.5">
              {["#10B981", "#C8F169", "#0C110E", "#F59E0B"].map((c, i) => (
                <span
                  key={c}
                  style={{ background: c }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ring-[3px] ring-[#F4F1EA]"
                >
                  {["A", "T", "K", "M"][i]}
                </span>
              ))}
            </div>
            <p className="text-sm text-black/60">
              <span className="font-bold text-[#0C110E]">10,000+</span> people trading
              <br className="sm:hidden" /> without the trust issues
            </p>
          </div>
        </div>

        <div className="relative lg:pl-10">
          {/* real photo — wipes up from the bottom while the image settles */}
          <div
            style={d(150)}
            className="anim-wipe relative ml-auto aspect-[4/5] w-full max-w-[560px] overflow-hidden rounded-[32px] bg-ink sm:aspect-[5/5] lg:aspect-[4/5]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1200&q=80&auto=format&fit=crop"
              alt="Courier handing a package to a happy customer"
              style={d(150)}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
            <span className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-ink backdrop-blur sm:right-5 sm:top-5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Delivered · funds released
            </span>
          </div>

          {/* escrow card overlapping the photo */}
          <div className="relative z-10 mx-auto -mt-44 w-[90%] max-w-[360px] -rotate-2 sm:-mt-56 lg:absolute lg:-left-6 lg:bottom-[-3rem] lg:mt-0 lg:w-[340px] xl:-left-16 xl:w-[360px]">
            <div style={d(650)} className="anim-focus">
              <EscrowDemo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
