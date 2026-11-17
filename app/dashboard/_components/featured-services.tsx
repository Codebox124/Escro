"use client";

/* eslint-disable @next/next/no-img-element -- provider-uploaded images come from arbitrary hosts */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
  IconMapPin,
  IconRefresh,
} from "@/components/icons";
import { servicesService } from "@/services/shop";
import { formatMoney } from "@/lib/money";
import { ProductImage, RatingLabel, StateCard, errorMessage, initials } from "./featured-goods";

/* ------------------------------------------------------------------ */
/* Shared services-marketplace types + helpers                          */
/* ------------------------------------------------------------------ */

export type PriceType = "fixed" | "starting_at" | "hourly";

export type ServiceProvider = {
  id: string;
  name: string;
  avatar: string | null;
  type?: string | null;
  verified: boolean;
};

export type ServiceItem = {
  id: string;
  title: string;
  description: string | null;
  category: { slug: string; name: string } | null;
  price: number;
  priceType: PriceType;
  currency: string;
  deliveryTime: string | null;
  location: string | null;
  image: string | null;
  isActive: boolean;
  rating: number;
  reviews: number;
  requests: number;
  provider: ServiceProvider | null;
  createdAt: string;
  updatedAt: string;
};

export type ServiceCategory = { slug: string; name: string; count: number };

export type ServicePage = { services: ServiceItem[]; total: number; page: number; pages: number };

export type RequestStatus = "pending" | "accepted" | "declined" | "completed" | "cancelled";

export type ServiceRequestItem = {
  id: string;
  status: RequestStatus;
  message: string;
  budget: number | null;
  preferredDate: string | null;
  contactPhone: string | null;
  providerNote: string | null;
  service: {
    id: string;
    title: string;
    price: number;
    priceType: PriceType;
    currency: string;
    image: string | null;
    providerId: string;
    providerName?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

/** "₦50,000" · "From ₦50,000" · "₦5,000/hr" */
export function priceLabel(price: number | string | null | undefined, priceType: string | null | undefined, currency?: string | null) {
  const amount = formatMoney(price, currency, { decimals: Number(price) % 1 === 0 ? 0 : 2 });
  if (priceType === "starting_at") return `From ${amount}`;
  if (priceType === "hourly") return `${amount}/hr`;
  return amount;
}

const MIGRATION_RE = /004_services\.sql/;
export const isMigrationError = (msg?: string | null) => !!msg && MIGRATION_RE.test(msg);

export function ProviderAvatar({ provider, className = "h-7 w-7 text-[10px]" }: { provider: ServiceProvider | null; className?: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream font-space font-bold text-ink ring-1 ring-black/5 ${className}`}
    >
      {provider?.avatar && !broken ? (
        <img src={provider.avatar} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        initials(provider?.name)
      )}
    </span>
  );
}

export function VerifiedBadge({ label = true }: { label?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
      <IconCircleCheck className="h-3 w-3" />
      {label && "Verified"}
    </span>
  );
}

/** Error card; shows the amber "Database setup needed" notice when the services migration hasn't run. */
export function ServicesErrorState({
  message,
  title,
  onRetry,
}: {
  message: string;
  title: string;
  onRetry?: () => void;
}) {
  const migration = isMigrationError(message);
  return (
    <div
      className={`flex flex-col items-center rounded-3xl px-6 py-14 text-center ring-1 ${
        migration ? "bg-amber-50 ring-amber-600/20" : "bg-white ring-black/5"
      }`}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
          migration ? "bg-amber-100 text-amber-700" : "bg-red-50 text-red-600"
        }`}
      >
        <IconAlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-extrabold tracking-tight text-ink">
        {migration ? "Database setup needed" : title}
      </h2>
      <p className={`mt-1 max-w-md wrap-break-word text-sm ${migration ? "text-amber-800" : "text-black/55"}`}>
        {migration ? (
          <>
            Run <span className="font-space">backend/database/migrations/004_services.sql</span> in the Supabase SQL
            editor, then try again.
          </>
        ) : (
          message
        )}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
        >
          <IconRefresh className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Service card                                                          */
/* ------------------------------------------------------------------ */

export const SERVICE_GRID = "grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4";

export function ServiceCard({ service }: { service: ServiceItem }) {
  const href = `/dashboard/services/${service.id}`;
  return (
    <div className="group relative flex min-w-0 flex-col overflow-hidden rounded-3xl bg-white p-2 ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgba(12,17,14,0.35)]">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-4/3 overflow-hidden rounded-2xl bg-cream"
      >
        <ProductImage
          src={service.image}
          alt={service.title}
          className="transition-transform duration-500 group-hover:scale-105"
        />
        {service.category && (
          <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-white/95 px-2.5 py-1 font-space text-[10px] font-bold uppercase tracking-wider text-emerald-700 shadow-sm sm:left-3 sm:top-3">
            {service.category.name}
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-2 pt-3 sm:p-3">
        <div className="flex min-w-0 items-center gap-2">
          <ProviderAvatar provider={service.provider} />
          <span className="truncate text-xs font-semibold text-black/60">{service.provider?.name ?? "Provider"}</span>
          {service.provider?.verified && <VerifiedBadge label={false} />}
        </div>

        <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-ink">
          <Link
            href={href}
            className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 after:absolute after:inset-0 after:content-['']"
          >
            {service.title}
          </Link>
        </h3>

        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-black/50">
          {service.location && (
            <span className="inline-flex min-w-0 max-w-full items-center gap-1">
              <IconMapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{service.location}</span>
            </span>
          )}
          {service.deliveryTime && (
            <span className="inline-flex min-w-0 max-w-full items-center gap-1">
              <IconClock className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{service.deliveryTime}</span>
            </span>
          )}
        </div>

        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between gap-2 border-t border-black/5 pt-3">
            <RatingLabel rating={service.rating} reviews={service.reviews} />
            <span className="min-w-0 truncate font-space text-base font-bold tracking-tight text-ink">
              {priceLabel(service.price, service.priceType, service.currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ServiceGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={SERVICE_GRID} aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-3xl bg-white p-2 ring-1 ring-black/5">
          <div className="aspect-4/3 rounded-2xl bg-cream" />
          <div className="space-y-2.5 p-2 pt-3 sm:p-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-black/5" />
              <div className="h-3 w-1/3 rounded-full bg-black/5" />
            </div>
            <div className="h-4 w-3/4 rounded-full bg-black/5" />
            <div className="h-3 w-1/2 rounded-full bg-black/5" />
            <div className="flex justify-between pt-2">
              <div className="h-4 w-12 rounded-full bg-black/5" />
              <div className="h-5 w-20 rounded-full bg-black/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Home: newest services                                                */
/* ------------------------------------------------------------------ */

type HomeState = { key: number; services: ServiceItem[]; error: string | null };

export default function FeaturedServices() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<HomeState>({ key: -1, services: [], error: null });

  useEffect(() => {
    let cancelled = false;
    servicesService
      .list({ sort: "newest", limit: 6 })
      .then((res: ServicePage) => {
        if (!cancelled) setState({ key: attempt, services: res?.services ?? [], error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ key: attempt, services: [], error: errorMessage(e, "Failed to load services") });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const loading = state.key !== attempt;
  const { services, error } = state;

  return (
    <section className="py-10 md:py-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
        <div className="min-w-0">
          <p className="eyebrow font-space text-emerald-700">Hire a pro</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl">Services</h2>
          <p className="mt-1 text-sm text-black/55">The latest services offered by providers on Escro</p>
        </div>
        {!loading && services.length > 0 && (
          <Link
            href="/dashboard/services"
            className="group inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border-2 border-ink/15 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
          >
            See all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {loading ? (
        <ServiceGridSkeleton count={3} />
      ) : error ? (
        <ServicesErrorState title="Couldn't load services" message={error} onRetry={() => setAttempt((a) => a + 1)} />
      ) : services.length === 0 ? (
        <StateCard
          tone="lime"
          icon={<Briefcase className="h-6 w-6" />}
          title="No services yet"
          text="Providers haven't listed any services yet. Check back soon."
        />
      ) : (
        <div className={SERVICE_GRID}>
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </section>
  );
}
