"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  IconChevronRight,
  IconClock,
  IconMapPin,
  IoMdSend,
  IconTag,
  IconUsers,
  Loader2,
} from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { servicesService } from "@/services/shop";
import { authService } from "@/services/auth";
import { formatMoney } from "@/lib/money";
import { ProductImage, RatingLabel, StateCard, errorMessage } from "../../_components/featured-goods";
import {
  ProviderAvatar,
  ServicesErrorState,
  VerifiedBadge,
  priceLabel,
  type ServiceItem,
} from "../../_components/featured-services";

type State = { key: string; service: ServiceItem | null; error: string | null; notFound: boolean };

const isNotFound = (msg: string) => /not\s*found|404|no service/i.test(msg);

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [attempt, setAttempt] = useState(0);
  const key = `${id}#${attempt}`;
  const [state, setState] = useState<State>({ key: "", service: null, error: null, notFound: false });

  useEffect(() => {
    let cancelled = false;
    servicesService
      .get(id)
      .then((r: { service?: ServiceItem }) => {
        if (cancelled) return;
        setState({ key, service: r?.service ?? null, error: null, notFound: !r?.service });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = errorMessage(e, "Failed to load this service");
        setState({ key, service: null, error: msg, notFound: isNotFound(msg) });
      });
    return () => {
      cancelled = true;
    };
  }, [id, key]);

  const loading = state.key !== key;

  return (
    <div className="page-container py-6 md:py-8">
      <Link
        href="/dashboard/services"
        className="mb-5 inline-flex h-10 items-center gap-2 rounded-full bg-white pl-2 pr-4 text-sm font-semibold text-ink ring-1 ring-black/5 transition-colors hover:ring-ink/30"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cream">
          <ArrowLeft className="h-3.5 w-3.5" />
        </span>
        Back to services
      </Link>

      {loading ? (
        <DetailSkeleton />
      ) : state.notFound ? (
        <StateCard
          icon={<Briefcase className="h-6 w-6" />}
          title="Service not found"
          text="This service may have been removed or is no longer offered."
          action={
            <Link
              href="/dashboard/services"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
            >
              Browse services
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : state.error || !state.service ? (
        <ServicesErrorState
          title="Couldn't load this service"
          message={state.error ?? "Something went wrong"}
          onRetry={() => setAttempt((a) => a + 1)}
        />
      ) : (
        <ServiceView key={state.service.id} service={state.service} />
      )}
    </div>
  );
}

function ServiceView({ service }: { service: ServiceItem }) {
  const categoryHref = service.category
    ? `/dashboard/services?category=${encodeURIComponent(service.category.slug)}`
    : null;
  const [ownService] = useState(() => {
    const user = authService.getUser() as { id?: string } | null;
    return !!user?.id && !!service.provider?.id && user.id === service.provider.id;
  });

  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5 flex min-w-0 items-center gap-1.5 text-xs text-black/50">
        <Link href="/dashboard/services" className="shrink-0 hover:text-ink">
          Services
        </Link>
        {service.category && categoryHref && (
          <>
            <IconChevronRight className="h-3 w-3 shrink-0" />
            <Link href={categoryHref} className="shrink-0 hover:text-ink">
              {service.category.name}
            </Link>
          </>
        )}
        <IconChevronRight className="h-3 w-3 shrink-0" />
        <span className="truncate font-semibold text-ink">{service.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        {/* Main */}
        <div className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-3xl bg-white p-2 ring-1 ring-black/5">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-cream">
              <ProductImage src={service.image} alt={service.title} iconClassName="h-16 w-16" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {service.category && categoryHref && (
                <Link
                  href={categoryHref}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 font-space text-[11px] uppercase tracking-widest text-emerald-700 ring-1 ring-black/5 hover:ring-ink/30"
                >
                  <IconTag className="h-3.5 w-3.5" />
                  {service.category.name}
                </Link>
              )}
              {!service.isActive && (
                <span className="inline-flex h-8 items-center rounded-full bg-black/5 px-3 text-[11px] font-bold text-black/55">
                  Not taking requests
                </span>
              )}
            </div>

            <h1 className="mt-4 break-words text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl md:text-4xl">
              {service.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <RatingLabel rating={service.rating} reviews={service.reviews} size="md" />
              {service.requests > 0 && (
                <>
                  <span className="text-black/20">·</span>
                  <span className="inline-flex items-center gap-1 font-space text-xs text-black/50">
                    <IconUsers className="h-3.5 w-3.5" />
                    {service.requests.toLocaleString()} {service.requests === 1 ? "request" : "requests"}
                  </span>
                </>
              )}
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <Fact label={service.priceType === "hourly" ? "Rate" : "Price"}>
                <span className="font-space text-lg font-bold tracking-tight text-ink">
                  {priceLabel(service.price, service.priceType, service.currency)}
                </span>
              </Fact>
              <Fact label="Delivery" icon={<IconClock className="h-4 w-4 shrink-0 text-black/40" />}>
                {service.deliveryTime || "To be agreed"}
              </Fact>
              <Fact label="Location" icon={<IconMapPin className="h-4 w-4 shrink-0 text-black/40" />}>
                {service.location || "Not specified"}
              </Fact>
            </div>
          </div>

          <section className="surface-card p-5 sm:p-7">
            <p className="eyebrow font-space text-emerald-700">Details</p>
            <h2 className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-ink sm:text-2xl">About this service</h2>
            {service.description ? (
              <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-black/65 sm:text-base">
                {service.description}
              </p>
            ) : (
              <p className="mt-3 text-sm text-black/45">The provider hasn&apos;t added a description yet.</p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
          {/* Provider card */}
          <div className="flex items-center gap-3 rounded-3xl bg-white p-4 ring-1 ring-black/5">
            <ProviderAvatar provider={service.provider} className="h-12 w-12 text-sm" />
            <div className="min-w-0 flex-1">
              <p className="font-space text-[10px] uppercase tracking-widest text-black/45">Offered by</p>
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate font-bold text-ink">{service.provider?.name ?? "Provider"}</span>
                {service.provider?.verified && <VerifiedBadge />}
              </div>
              {service.provider?.type && (
                <p className="truncate text-xs capitalize text-black/50">{service.provider.type}</p>
              )}
            </div>
          </div>

          {ownService ? (
            <div className="rounded-3xl bg-white p-5 ring-1 ring-black/5">
              <p className="font-bold text-ink">This is your service</p>
              <p className="mt-1 text-sm text-black/55">
                You can&apos;t request your own service. Manage it and its incoming requests from your provider
                dashboard.
              </p>
            </div>
          ) : !service.isActive ? (
            <div className="rounded-3xl bg-white p-5 ring-1 ring-black/5">
              <p className="font-bold text-ink">Not taking requests</p>
              <p className="mt-1 text-sm text-black/55">
                The provider has paused this service. Check back later or browse similar services.
              </p>
            </div>
          ) : (
            <RequestForm service={service} />
          )}
        </aside>
      </div>
    </>
  );
}

function Fact({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white p-3.5 ring-1 ring-black/5">
      <p className="font-space text-[10px] uppercase tracking-widest text-black/45">{label}</p>
      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-sm font-semibold text-ink">
        {icon}
        <span className="min-w-0 break-words">{children}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Request form                                                          */
/* ------------------------------------------------------------------ */

const todayISO = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const currencySymbol = (currency?: string | null) =>
  formatMoney(0, currency, { decimals: 0 }).replace(/[\d\s.,]/g, "") || "₦";

const OWN_SERVICE_RE = /own service/i;

const fieldClass =
  "rounded-2xl border-0 bg-cream text-sm text-ink shadow-none placeholder:text-black/40 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-lime-dark/60";

function RequestForm({ service }: { service: ServiceItem }) {
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState("");
  const [date, setDate] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const minDate = todayISO();
  const trimmed = message.trim();
  const budgetNum = budget.trim() === "" ? null : Number(budget);

  const messageError =
    trimmed.length === 0
      ? "Tell the provider what you need"
      : trimmed.length < 10
        ? "Please add a bit more detail (at least 10 characters)"
        : null;
  const budgetError =
    budgetNum !== null && (!Number.isFinite(budgetNum) || budgetNum < 0) ? "Enter a valid amount" : null;
  const dateError = date && date < minDate ? "Choose today or a future date" : null;
  const invalid = !!(messageError || budgetError || dateError);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (invalid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, string | number> = { message: trimmed };
      if (budgetNum !== null) payload.budget = budgetNum;
      if (date) payload.preferredDate = date;
      if (phone.trim()) payload.contactPhone = phone.trim();
      await servicesService.request(service.id, payload);
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, "Couldn't send your request"));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-ink p-5 text-white sm:p-6" role="status">
        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-lime/15 blur-2xl" />
        <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-lime text-ink">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <p className="relative mt-4 text-lg font-extrabold tracking-tight">Request sent</p>
        <p className="relative mt-1 text-sm text-white/70">
          {service.provider?.name ?? "The provider"} will review it and respond. Track its status under My requests.
        </p>
        <div className="relative mt-5 flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Link
            href="/dashboard/services?tab=requests"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-ink transition-transform hover:scale-[1.02]"
          >
            View my requests
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/services"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full px-5 text-sm font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/10"
          >
            Keep browsing
          </Link>
        </div>
      </div>
    );
  }

  const ownServiceError = !!error && OWN_SERVICE_RE.test(error);

  return (
    <form onSubmit={submit} noValidate className="rounded-3xl bg-white p-5 ring-1 ring-black/5 sm:p-6">
      <p className="eyebrow font-space text-emerald-700">Get started</p>
      <h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em] text-ink">Request this service</h2>
      <p className="mt-1 text-sm text-black/55">
        Describe what you need. The provider will accept or decline and follow up with you.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <Label htmlFor="req-message" className="mb-1.5 block text-sm font-semibold text-ink">
            Message <span className="text-red-600">*</span>
          </Label>
          <Textarea
            id="req-message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={() => setTouched(true)}
            maxLength={2000}
            placeholder="What do you need done, and any important details?"
            aria-invalid={touched && !!messageError}
            aria-describedby="req-message-hint"
            className={`min-h-28 px-4 py-3 ${fieldClass}`}
          />
          <p
            id="req-message-hint"
            className={`mt-1 text-xs ${touched && messageError ? "text-red-600" : "text-black/45"}`}
          >
            {touched && messageError ? messageError : `${trimmed.length}/10 characters minimum`}
          </p>
        </div>

        <div className="grid gap-4 min-[420px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div className="min-w-0">
            <Label htmlFor="req-budget" className="mb-1.5 block text-sm font-semibold text-ink">
              Budget <span className="font-normal text-black/45">(optional)</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-space text-sm font-bold text-black/50">
                {currencySymbol(service.currency)}
              </span>
              <Input
                id="req-budget"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
                aria-invalid={!!budgetError}
                className={`h-12 pl-9 pr-4 font-space ${fieldClass}`}
              />
            </div>
            {budgetError && <p className="mt-1 text-xs text-red-600">{budgetError}</p>}
          </div>
          <div className="min-w-0">
            <Label htmlFor="req-date" className="mb-1.5 block text-sm font-semibold text-ink">
              Preferred date <span className="font-normal text-black/45">(optional)</span>
            </Label>
            <Input
              id="req-date"
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-invalid={!!dateError}
              className={`h-12 px-4 ${fieldClass}`}
            />
            {dateError && <p className="mt-1 text-xs text-red-600">{dateError}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="req-phone" className="mb-1.5 block text-sm font-semibold text-ink">
            Contact phone <span className="font-normal text-black/45">(optional)</span>
          </Label>
          <Input
            id="req-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0803 000 0000"
            className={`h-12 px-4 ${fieldClass}`}
          />
        </div>
      </div>

      {error &&
        (ownServiceError ? (
          <p className="mt-4 rounded-2xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800 ring-1 ring-amber-600/20">
            You can&apos;t request your own service.
          </p>
        ) : (
          <ServiceRequestError message={error} />
        ))}

      <button
        type="submit"
        disabled={submitting || ownServiceError}
        className="group mt-5 inline-flex h-12 w-full items-center justify-between gap-2 rounded-full bg-ink pl-5 pr-1.5 text-sm font-semibold text-white transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{submitting ? "Sending…" : "Send request"}</span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime text-ink transition-transform group-hover:translate-x-0.5">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <IoMdSend className="h-4 w-4" />}
        </span>
      </button>

      <p className="mt-3 flex gap-2 text-xs text-black/45">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Sending a request is free. Payment for services is arranged directly with the provider and isn&apos;t held
          in escrow yet.
        </span>
      </p>
    </form>
  );
}

function ServiceRequestError({ message }: { message: string }) {
  const migration = /004_services\.sql/.test(message);
  return (
    <div
      className={`mt-4 flex gap-2 rounded-2xl px-3 py-2.5 text-sm ring-1 ${
        migration ? "bg-amber-50 text-amber-800 ring-amber-600/20" : "bg-red-50 text-red-700 ring-red-600/20"
      }`}
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="min-w-0 break-words">
        {migration
          ? "Database setup needed — run backend/database/migrations/004_services.sql in the Supabase SQL editor."
          : message}
      </span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid animate-pulse gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
      <div className="space-y-4">
        <div className="aspect-video rounded-3xl bg-white p-2 ring-1 ring-black/5">
          <div className="h-full w-full rounded-2xl bg-cream" />
        </div>
        <div className="h-8 w-40 rounded-full bg-black/5" />
        <div className="h-10 w-4/5 rounded-2xl bg-black/5" />
        <div className="grid gap-2 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-black/5" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-20 rounded-3xl bg-black/5" />
        <div className="h-96 rounded-3xl bg-black/5" />
      </div>
    </div>
  );
}
