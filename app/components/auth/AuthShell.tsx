"use client";

import React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, ArrowLeft, ArrowRight, ShieldCheck } from "@/components/icons";
import { Logo } from "@/app/components/landing/Logo";

interface AuthShellProps {
  /** Form card heading */
  title: string;
  /** Muted copy under the heading */
  subtitle?: React.ReactNode;
  /** Small mono label above the form title */
  eyebrow?: string;
  /** Brand-panel headline (lg+ only) */
  heading: React.ReactNode;
  /** Brand-panel supporting copy */
  description: string;
  /** Extra brand-panel content (feature list, role cards, ...) */
  aside?: React.ReactNode;
  /** Content rendered under the card (e.g. "Already have an account?") */
  footer?: React.ReactNode;
  /** Wider form card for longer forms */
  wide?: boolean;
  /** Hide the default title block (when the child renders its own header) */
  hideHeader?: boolean;
  children: React.ReactNode;
}

/** Brand mark, kept for backwards compatibility. Renders the landing Logo. */
export function BrandMark({ dark = false }: { dark?: boolean }) {
  return <Logo dark={dark} />;
}

/* Shared auth form styles */
export const authInputClass =
  "h-12 w-full rounded-2xl border-0 bg-white pl-11 text-[15px] text-ink ring-1 ring-black/10 outline-none transition placeholder:text-black/35 hover:ring-black/20 focus:ring-2 focus:ring-ink";
export const authLabelClass = "mb-2 block text-sm font-semibold text-ink";
export const authIconClass =
  "pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-black/35";
export const authLinkClass =
  "rounded font-bold text-ink underline decoration-lime-dark decoration-2 underline-offset-4 transition-colors hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30";

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

/** Ink pill submit button with the landing's lime arrow circle. */
export function AuthSubmitButton({
  loading,
  loadingText,
  children,
  className = "",
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
}) {
  return (
    <button
      type="submit"
      {...props}
      disabled={loading || disabled}
      className={`group flex h-12 w-full items-center justify-center gap-3 rounded-full bg-ink pl-6 pr-2 text-[15px] font-bold text-white transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2 pr-4">
          <Spinner />
          {loadingText}
        </span>
      ) : (
        <>
          <span className="flex-1 text-center">{children}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink transition-transform group-hover:translate-x-0.5">
            <ArrowRight className="h-4 w-4" />
          </span>
        </>
      )}
    </button>
  );
}

/** Error banner for auth forms. */
export function AuthError({ message }: { message: string }) {
  return (
    <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

/** Lime italic emphasis used inside brand-panel headlines. */
export function Highlight({ children }: { children: React.ReactNode }) {
  return <span className="italic text-lime">{children}</span>;
}

const slides = [
  {
    src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=80&auto=format&fit=crop",
    alt: "Shopper carrying shopping bags",
    tag: "For buyers",
    quote: "I finally shop from new stores without the fear of being scammed.",
    name: "Amaka O.",
    role: "Buyer · Lagos",
  },
  {
    src: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80&auto=format&fit=crop",
    alt: "Store owner serving a customer at the counter",
    tag: "For sellers",
    quote: "Customers trust my store more because their money is protected.",
    name: "Tunde A.",
    role: "Store owner · Abuja",
  },
  {
    src: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1400&q=80&auto=format&fit=crop",
    alt: "Courier handing a package to a customer",
    tag: "Delivered & confirmed",
    quote: "Hand it over, buyer confirms, money releases. Simple as that.",
    name: "Chidi E.",
    role: "Courier · Port Harcourt",
  },
  {
    src: "https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=1400&q=80&auto=format&fit=crop",
    alt: "Courier riding a delivery scooter at night",
    tag: "For couriers",
    quote: "I pick jobs near me and get paid on every single drop.",
    name: "Musa K.",
    role: "Courier · Kano",
  },
];

const SLIDE_MS = 6000;

/** Rotating real-photo gallery with story-style progress bars. */
function AuthGallery({ compact = false }: { compact?: boolean }) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const id = setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(id);
  }, [index]);

  const slide = slides[index];

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink">
      {slides.map((s, i) => (
        <motion.img
          key={s.src}
          src={s.src}
          alt={s.alt}
          loading={i === 0 ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-cover"
          initial={false}
          animate={{ opacity: i === index ? 1 : 0, scale: i === index ? 1.08 : 1 }}
          transition={{
            opacity: { duration: 1, ease: "easeInOut" },
            scale: { duration: SLIDE_MS / 1000 + 1, ease: "linear" },
          }}
        />
      ))}

      {/* legibility gradients */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/40" />

      {/* top: logo + progress */}
      <div className="absolute inset-x-0 top-0 z-10 p-5 sm:p-8">
        <div className="flex gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              className="group relative h-6 flex-1"
            >
              <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/25">
                {i < index && <span className="absolute inset-0 bg-white" />}
                {i === index && (
                  <motion.span
                    key={index}
                    className="absolute inset-y-0 left-0 bg-lime"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
        {!compact && (
        <div className="mt-4 flex items-center justify-between">
          <Link
            href="/"
            className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60"
          >
            <Logo dark />
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-lime" />
            Escrow-protected
          </span>
        </div>
        )}
      </div>

      {/* bottom: caption */}
      <div className={`absolute inset-x-0 bottom-0 z-10 ${compact ? "p-5" : "p-8 xl:p-12"}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex rounded-full bg-lime px-3 py-1 font-space text-[11px] font-bold uppercase tracking-widest text-ink">
              {slide.tag}
            </span>
            {compact ? (
              <p className="mt-3 text-lg font-extrabold leading-snug tracking-tight text-white">
                {slide.quote}
              </p>
            ) : (
              <>
                <p className="mt-5 max-w-xl text-3xl font-extrabold leading-[1.1] tracking-[-0.02em] text-white xl:text-[2.6rem]">
                  &ldquo;{slide.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-extrabold text-ink">
                    {slide.name[0]}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{slide.name}</p>
                    <p className="font-space text-[11px] uppercase tracking-wider text-white/60">
                      {slide.role}
                    </p>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function AuthShell({
  title,
  subtitle,
  eyebrow,
  footer,
  wide = false,
  hideHeader = false,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-dvh bg-app lg:grid lg:grid-cols-2">
      {/* Photo gallery (lg+) — 50% */}
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-dvh lg:p-3">
        <div className="anim-wipe h-full overflow-hidden rounded-[32px]">
          <AuthGallery />
        </div>
      </aside>

      {/* Form column */}
      <main className="relative flex min-h-dvh flex-col px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#0C110E14_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 lg:invisible"
            aria-label="Escro home"
          >
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-black/60 transition-colors hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to site</span>
            <span className="sm:hidden">Home</span>
          </Link>
        </div>

        <div className="relative z-10 mt-4 h-52 overflow-hidden rounded-3xl sm:h-64 lg:hidden">
          <AuthGallery compact />
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center py-8 sm:py-10">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ "--d": "200ms" } as React.CSSProperties}
            className={`anim-focus w-full ${wide ? "max-w-xl" : "max-w-md"}`}
          >
            <div className="rounded-3xl bg-white p-6 shadow-[0_30px_60px_-40px_rgba(12,17,14,0.35)] ring-1 ring-black/5 sm:p-10">
              {!hideHeader && (
                <div className="mb-8">
                  {eyebrow && (
                    <p className="eyebrow mb-3 font-space text-emerald-700">{eyebrow}</p>
                  )}
                  <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="mt-2 text-sm text-black/55 sm:text-base">{subtitle}</p>
                  )}
                </div>
              )}
              {children}
            </div>

            {footer && <div className="mt-6 text-center">{footer}</div>}

            <div className="mt-5 flex items-center justify-center gap-2 font-space text-[11px] uppercase tracking-widest text-black/40">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Secured by Escro</span>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
