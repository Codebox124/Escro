"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Plus } from "@/components/icons";
import { Logo } from "./Logo";

const faqs = [
  {
    q: "How does escrow actually protect me?",
    a: "When you pay, the money goes to Escro — not the seller. We only release it after you confirm the item arrived as described. If it doesn't, you open a dispute and the funds stay frozen until it's resolved.",
  },
  {
    q: "When do sellers get paid?",
    a: "The instant the buyer confirms delivery. If the buyer doesn't respond within the confirmation window after a verified delivery, funds are released automatically.",
  },
  {
    q: "What does it cost?",
    a: "Buyers pay nothing extra. Sellers pay a small transaction fee only on completed sales — no monthly subscription, no listing fees.",
  },
  {
    q: "Can I become a courier or agency partner?",
    a: "Yes. Sign up, choose Courier or Agency, complete verification, and you can start accepting delivery jobs from the live map.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-[#F4F1EA] pb-20 sm:pb-28">
      <div className="page-container grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div>
          <p className="font-space text-sm uppercase tracking-widest text-emerald-700">FAQ</p>
          <h2 className="mt-3 text-4xl font-extrabold leading-[1] tracking-[-0.03em] text-[#0C110E] sm:text-5xl">
            Questions, answered.
          </h2>
          <p className="mt-4 max-w-sm text-black/60">
            Still curious? Our support team replies in minutes, not days.
          </p>
        </div>
        <div className="divide-y divide-black/10 border-y border-black/10">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left sm:py-6"
                >
                  <span className="text-lg font-bold tracking-tight text-[#0C110E] sm:text-xl">{f.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isOpen ? "bg-[#0C110E] text-[#C8F169]" : "bg-white text-[#0C110E] ring-1 ring-black/10"
                    }`}
                  >
                    <Plus className="h-5 w-5" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 leading-relaxed text-black/60">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Closing() {
  return (
    <>
      <Faq />

      <footer className="relative overflow-hidden bg-[#0C110E] text-white">
        {/* CTA */}
        <div className="page-container pt-20 sm:pt-28">
          <div className="relative overflow-hidden rounded-[32px] bg-[#C8F169] p-8 text-[#0C110E] sm:p-12 lg:p-16">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/40 blur-3xl" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="max-w-2xl text-4xl font-extrabold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Stop hoping. Start trading safely.
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#0C110E] px-7 font-bold text-white transition-transform hover:scale-[1.03]"
                >
                  Create free account
                  <ArrowUpRight className="h-5 w-5 text-[#C8F169] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-14 items-center justify-center rounded-full border-2 border-[#0C110E] px-7 font-bold transition-colors hover:bg-[#0C110E] hover:text-white"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* links */}
        <div className="page-container grid grid-cols-2 gap-x-6 gap-y-10 py-16 sm:grid-cols-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Logo dark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
              The escrow-protected marketplace for buyers, sellers, couriers and agencies.
            </p>
          </div>
          {[
            ["Platform", [["How it works", "#journey"], ["Why Escro", "#features"], ["FAQ", "#faq"]]],
            ["Join", [["Buy", "/signup"], ["Sell", "/signup"], ["Deliver", "/signup"], ["Sign in", "/login"]]],
            ["Company", [["About", "#"], ["Support", "#"], ["Privacy", "#"], ["Terms", "#"]]],
          ].map(([title, items]) => (
            <div key={title as string}>
              <p className="font-space text-xs uppercase tracking-widest text-[#C8F169]">{title as string}</p>
              <ul className="mt-4 space-y-1">
                {(items as string[][]).map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="inline-flex min-h-10 items-center text-sm font-medium text-white/70 transition-colors hover:text-white"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* giant wordmark */}
        <div className="page-container">
          <div className="flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-white/40 sm:flex-row sm:justify-between">
            <span>© {new Date().getFullYear()} Escro. All rights reserved.</span>
            <span className="font-space">Funds protected • Every order • Every time</span>
          </div>
        </div>
        <p
          aria-hidden="true"
          className="pointer-events-none select-none text-center text-[27vw] font-extrabold leading-[0.75] tracking-[-0.08em] text-white/[0.04]"
        >
          escro
        </p>
      </footer>
    </>
  );
}
