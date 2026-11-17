"use client";

import { motion } from "motion/react";
import { BadgeCheck, Gavel, MapPin, ShieldCheck, Store, Zap } from "@/components/icons";

const reveal = {
  hidden: { opacity: 0, y: 30, filter: "blur(12px)", clipPath: "inset(12% 0 0 0 round 28px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    clipPath: "inset(0% 0 0 0 round 28px)",
    transition: { delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function Card({
  i,
  className = "",
  children,
}: {
  i: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      custom={i}
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className={`relative overflow-hidden rounded-[28px] p-6 sm:p-8 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function MiniMap() {
  return (
    <div className="relative mt-6 h-40 overflow-hidden rounded-2xl bg-[#18201B] sm:h-48">
      <div className="absolute inset-0 bg-[linear-gradient(#ffffff0d_1px,transparent_1px),linear-gradient(90deg,#ffffff0d_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute left-1/2 top-1/2 h-[160px] w-[300px] -translate-x-1/2 -translate-y-1/2">
        <svg viewBox="0 0 300 160" width="300" height="160" className="absolute inset-0 max-w-none" aria-hidden="true">
          <path
            d="M20 130 C 80 130, 70 60, 140 70 S 230 30, 280 30"
            fill="none"
            stroke="#C8F16955"
            strokeWidth="3"
            strokeDasharray="6 8"
          />
        </svg>
        <span className="absolute left-[6px] top-[116px] flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs">🏪</span>
        <span className="absolute left-[266px] top-[16px] flex h-7 w-7 items-center justify-center rounded-full bg-[#C8F169] text-xs">🏠</span>
        <span
          className="absolute left-0 top-0 h-5 w-5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.25)] [animation:escro-route_6s_ease-in-out_infinite_alternate]"
          style={{ offsetPath: "path('M20 130 C 80 130, 70 60, 140 70 S 230 30, 280 30')", offsetRotate: "0deg" }}
        />
      </div>
      <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 font-space text-[10px] text-white/80 backdrop-blur">
        ETA 12 MIN
      </div>
    </div>
  );
}

function PayoutBars() {
  const bars = [40, 65, 45, 80, 60, 95, 75];
  return (
    <div className="mt-6 flex h-24 items-end gap-2">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          whileInView={{ height: `${h}%` }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.06, duration: 0.6, ease: "easeOut" }}
          className={`flex-1 rounded-t-lg ${i === 5 ? "bg-[#0C110E]" : "bg-[#0C110E]/20"}`}
        />
      ))}
    </div>
  );
}

export default function Bento() {
  return (
    <section id="features" className="bg-[#0C110E] py-20 text-white sm:py-28">
      <div className="page-container">
        <div className="max-w-3xl">
          <p className="font-space text-sm uppercase tracking-widest text-[#C8F169]">Why Escro</p>
          <h2 className="mt-3 text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
            Trust, built into
            <span className="text-white/40"> every single tap.</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:mt-16 md:grid-cols-6 md:gap-5">
          {/* Vault — hero card */}
          <Card i={0} className="bg-emerald-600 md:col-span-4 md:row-span-2">
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full border-[40px] border-white/10" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full border-[24px] border-white/10" />
            <ShieldCheck className="h-10 w-10" />
            <h3 className="mt-6 max-w-md text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Your money sits in a vault, not in a stranger&apos;s pocket.
            </h3>
            <p className="mt-4 max-w-md text-white/80">
              Every naira, dollar and cent is held by Escro until delivery is confirmed. No
              more &quot;send money first&quot; anxiety.
            </p>
            <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
              {[
                ["100%", "Escrow covered"],
                ["0", "Lost payments"],
                ["24/7", "Monitoring"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl bg-black/15 p-3 sm:p-4">
                  <p className="font-space text-xl font-bold sm:text-2xl">{v}</p>
                  <p className="mt-1 text-[11px] leading-tight text-white/70 sm:text-xs">{l}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Fast payouts */}
          <Card i={1} className="bg-[#C8F169] text-[#0C110E] md:col-span-2">
            <Zap className="h-7 w-7" />
            <h3 className="mt-4 text-xl font-extrabold tracking-tight">Instant payouts</h3>
            <p className="mt-1 text-sm text-black/60">Sellers get paid the moment buyers confirm.</p>
            <PayoutBars />
          </Card>

          {/* Disputes */}
          <Card i={2} className="bg-white/[0.06] ring-1 ring-white/10 md:col-span-2">
            <Gavel className="h-7 w-7 text-[#C8F169]" />
            <h3 className="mt-4 text-xl font-extrabold tracking-tight">Fair disputes</h3>
            <p className="mt-1 text-sm text-white/60">
              Something off? Real humans review evidence from both sides. Funds stay frozen until
              it&apos;s resolved.
            </p>
          </Card>

          {/* Live tracking */}
          <Card i={3} className="bg-white/[0.06] ring-1 ring-white/10 md:col-span-3">
            <MapPin className="h-7 w-7 text-[#C8F169]" />
            <h3 className="mt-4 text-xl font-extrabold tracking-tight">Live courier tracking</h3>
            <p className="mt-1 text-sm text-white/60">Watch your order move across the city in real time.</p>
            <MiniMap />
          </Card>

          {/* Verified + multi-vendor */}
          <Card i={4} className="flex flex-col bg-white text-[#0C110E] md:col-span-3">
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-7 w-7 text-emerald-600" />
              <Store className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="mt-4 text-xl font-extrabold tracking-tight">Thousands of verified stores</h3>
            <p className="mt-1 text-sm text-black/60">
              Every seller is ID-checked. Shop across many vendors in one cart, with one checkout.
            </p>
            <div className="mt-6 space-y-2.5">
              {[
                ["Lagos Kicks", "Sneakers", "4.9"],
                ["Glow Studio", "Beauty", "4.8"],
                ["TechHub NG", "Electronics", "5.0"],
              ].map(([n, c, r]) => (
                <div
                  key={n}
                  className="flex items-center justify-between rounded-2xl bg-[#F4F1EA] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0C110E] text-sm font-bold text-[#C8F169]">
                      {n[0]}
                    </span>
                    <div>
                      <p className="flex items-center gap-1 text-sm font-bold">
                        {n} <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                      </p>
                      <p className="text-xs text-black/50">{c}</p>
                    </div>
                  </div>
                  <span className="font-space text-sm font-bold">★ {r}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
