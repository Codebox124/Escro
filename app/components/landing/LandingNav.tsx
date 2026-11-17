"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Menu, X } from "@/components/icons";
import { Logo } from "./Logo";

const links = [
  { label: "How it works", href: "#journey" },
  { label: "Why Escro", href: "#features" },
  { label: "Who it's for", href: "#roles" },
  { label: "FAQ", href: "#faq" },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
        <nav
          className={`mx-auto flex h-14 max-w-[94rem] items-center justify-between rounded-full pl-4 pr-2 transition-all duration-500 sm:h-16 sm:pl-6 ${
            scrolled
              ? "bg-[#0C110E]/90 text-white shadow-2xl shadow-black/20 backdrop-blur-xl"
              : "bg-white/60 text-[#0C110E] ring-1 ring-black/5 backdrop-blur-md"
          }`}
        >
          <Link href="/" aria-label="Escro home" className="shrink-0">
            <Logo dark={scrolled} />
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    scrolled
                      ? "text-white/70 hover:bg-white/10 hover:text-white"
                      : "text-black/60 hover:bg-black/5 hover:text-black"
                  }`}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5">
            <Link
              href="/login"
              className={`hidden h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors sm:inline-flex ${
                scrolled ? "text-white/80 hover:text-white" : "text-black/70 hover:text-black"
              }`}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-[#C8F169] pl-4 pr-3 text-sm font-bold text-[#0C110E] transition-transform hover:scale-[1.03] active:scale-[0.98] sm:h-12 sm:pl-5 sm:pr-4"
            >
              Get started
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full md:hidden ${
                scrolled ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"
              }`}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[60] flex flex-col bg-[#0C110E] text-white md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex h-[68px] items-center justify-between px-6 pt-3">
              <Logo dark />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="flex flex-1 flex-col justify-center gap-2 px-6">
              {links.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                >
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline gap-4 py-2 text-4xl font-bold tracking-tight"
                  >
                    <span className="font-space text-sm text-[#C8F169]">0{i + 1}</span>
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-3 p-6 pb-10">
              <Link
                href="/login"
                className="flex h-14 items-center justify-center rounded-full border border-white/20 font-semibold"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="flex h-14 items-center justify-center rounded-full bg-[#C8F169] font-bold text-[#0C110E]"
              >
                Get started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
