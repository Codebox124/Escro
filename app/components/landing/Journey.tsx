"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";
import { Bike, CreditCard, Lock, ThumbsUp, Wallet } from "@/components/icons";

const steps = [
  {
    icon: CreditCard,
    title: "You pay",
    body: "Checkout with card, transfer or wallet. Your money never goes straight to the seller.",
  },
  {
    icon: Lock,
    title: "We lock it",
    body: "Funds sit in the Escro vault. The seller sees they're secured and ships with confidence.",
  },
  {
    icon: Bike,
    title: "It travels",
    body: "A verified courier picks it up. Track every metre live on the map.",
  },
  {
    icon: ThumbsUp,
    title: "You confirm",
    body: "Check the item at your door. Not right? Raise a dispute and your money stays put.",
  },
  {
    icon: Wallet,
    title: "Everyone's paid",
    body: "Seller and courier are paid out instantly. Clean, fair, done.",
  },
];

export default function Journey() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const fill = useTransform(progress, [0, 1], ["0%", "100%"]);
  const [active, setActive] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(steps.length - 1, Math.max(0, Math.floor(v * steps.length))));
  });

  return (
    <section id="journey" className="bg-[#F4F1EA] py-20 sm:py-28">
      <div className="page-container">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-space text-sm uppercase tracking-widest text-emerald-700">
              The money journey
            </p>
            <h2 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1] tracking-[-0.03em] text-[#0C110E] sm:text-5xl lg:text-6xl">
              Follow your dollar from checkout to doorstep.
            </h2>
          </div>
          <p className="max-w-sm text-black/60">
            Scroll through it. Five steps, zero guesswork, and your money is protected at every
            single one.
          </p>
        </div>

        <div ref={ref} className="relative mt-14 sm:mt-20">
          {/* track: vertical on mobile, horizontal on lg */}
          <div className="absolute bottom-6 left-[27px] top-6 w-1 rounded-full bg-black/10 lg:hidden">
            <motion.div
              style={{ height: fill }}
              className="w-full rounded-full bg-gradient-to-b from-emerald-500 to-[#C8F169]"
            />
          </div>
          <div className="absolute left-[10%] right-[10%] top-[27px] hidden h-1 rounded-full bg-black/10 lg:block">
            <motion.div
              style={{ width: fill }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#C8F169]"
            />
          </div>

          <ol className="relative grid gap-8 lg:grid-cols-5 lg:gap-6">
            {steps.map((s, i) => {
              const on = i <= active;
              return (
                <li key={s.title} className="flex gap-5 lg:flex-col lg:items-center lg:text-center">
                  <motion.span
                    animate={{ scale: i === active ? 1.12 : 1 }}
                    className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-colors duration-500 ${
                      on
                        ? "bg-[#0C110E] text-[#C8F169] shadow-lg shadow-black/20"
                        : "bg-white text-black/40 ring-1 ring-black/10"
                    }`}
                  >
                    <s.icon className="h-6 w-6" />
                  </motion.span>
                  <div className="pt-1 lg:pt-4">
                    <span className="font-space text-xs text-black/40">STEP 0{i + 1}</span>
                    <h3
                      className={`mt-1 text-xl font-bold tracking-tight transition-colors duration-500 ${
                        on ? "text-[#0C110E]" : "text-black/50"
                      }`}
                    >
                      {s.title}
                    </h3>
                    <p
                      className={`mt-2 text-sm leading-relaxed transition-colors duration-500 ${
                        on ? "text-black/60" : "text-black/40"
                      }`}
                    >
                      {s.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
