"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconCheck,
  IconMotorbike,
  IconPower,
  IconRefresh,
  IconShieldCheck,
  IconStar,
  IconUser,
  Loader2,
} from "@/components/icons";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { courierApi } from "@/services/courier";

// ---------------------------------------------------------------- types

type CourierProfile = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  vehicleType: string | null;
  licenseNumber: string | null;
  isAvailable: boolean;
  isVerified: boolean;
  rating: number | null;
  totalDeliveries: number | null;
  earningsTotal: number | null;
  memberSince: string | null;
};

type Form = {
  fullName: string;
  phone: string;
  vehicleType: string;
  licenseNumber: string;
  isAvailable: boolean;
};

const VEHICLES = [
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bicycle", label: "Bicycle" },
  { value: "car", label: "Car" },
  { value: "van", label: "Van" },
  { value: "truck", label: "Truck" },
  { value: "on_foot", label: "On foot" },
];

const normalizeVehicle = (v: string | null | undefined) => {
  const raw = (v || "").trim();
  return VEHICLES.some((o) => o.value === raw.toLowerCase()) ? raw.toLowerCase() : raw;
};

/** Include a legacy/free-text value (e.g. "bike" from sign-up) so it still displays. */
const vehicleOptions = (current: string | null | undefined) => {
  const v = normalizeVehicle(current);
  if (!v || VEHICLES.some((o) => o.value === v)) return VEHICLES;
  return [...VEHICLES, { value: v, label: v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, " ") }];
};

const settingsSections = [
  { id: "account", label: "Profile", icon: IconUser },
  { id: "work", label: "Vehicle & Availability", icon: IconMotorbike },
];

// ---------------------------------------------------------------- helpers

const errMessage = (e: unknown, fallback: string) =>
  (e as { message?: string })?.message || fallback;

const toForm = (p: CourierProfile): Form => ({
  fullName: p.name ?? "",
  phone: p.phone ?? "",
  vehicleType: normalizeVehicle(p.vehicleType),
  licenseNumber: p.licenseNumber ?? "",
  isAvailable: !!p.isAvailable,
});

const initials = (name: string | null | undefined) =>
  (name || "Courier")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

const fmtMonth = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", { month: "short", year: "numeric" });
};

// ---------------------------------------------------------------- pieces

const SectionCard = ({
  icon: Icon,
  title,
  children,
  className = "",
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`surface-card overflow-hidden ${className}`}>
    <div className="flex items-center gap-3 border-b border-black/5 px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ink">
        <Icon className="h-5 w-5 text-lime" />
      </div>
      <h3 className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">{title}</h3>
    </div>
    <div className="p-4 sm:p-6">{children}</div>
  </div>
);

const Field = ({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={htmlFor} className="block font-space text-[10px] uppercase tracking-widest text-black/45">
      {label}
    </label>
    {children}
    {hint && <p className="text-xs text-black/50">{hint}</p>}
  </div>
);

const inputCls =
  "h-12 rounded-2xl border-0 bg-cream text-base text-ink ring-1 ring-black/5 focus-visible:ring-2 focus-visible:ring-lime-dark/60";

const ToggleSwitch = ({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) => (
  <div className="flex min-h-11 items-center justify-between gap-4 py-2">
    <div className="min-w-0">
      <p className="font-semibold text-ink">{label}</p>
      {description && <p className="text-sm text-black/55">{description}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 focus-visible:ring-offset-2 disabled:opacity-50 ${
        checked ? "bg-ink" : "bg-black/15"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full shadow-md transition-transform duration-200 ${
          checked ? "translate-x-[24px] bg-lime" : "translate-x-[4px] bg-white"
        }`}
      />
    </button>
  </div>
);

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-48 rounded-3xl bg-ink/80" />
      <div className="h-12 rounded-full bg-white ring-1 ring-black/5" />
      <div className="h-80 rounded-3xl bg-white ring-1 ring-black/5" />
      <div className="h-64 rounded-3xl bg-white ring-1 ring-black/5" />
    </div>
  );
}

// ---------------------------------------------------------------- page

export default function SettingsPage() {
  const [profile, setProfile] = useState<CourierProfile | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState("account");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const me = (await courierApi.me()) as CourierProfile;
      setProfile(me);
      setForm(toForm(me));
    } catch (e) {
      setLoadError(errMessage(e, "Couldn't load your profile."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const changes = useMemo(() => {
    if (!profile || !form) return {};
    const original = toForm(profile);
    const diff: Partial<Form> = {};
    if (form.fullName.trim() !== original.fullName) diff.fullName = form.fullName.trim();
    if (form.phone.trim() !== original.phone) diff.phone = form.phone.trim();
    if (form.vehicleType !== original.vehicleType) diff.vehicleType = form.vehicleType;
    if (form.licenseNumber.trim() !== original.licenseNumber) diff.licenseNumber = form.licenseNumber.trim();
    if (form.isAvailable !== original.isAvailable) diff.isAvailable = form.isAvailable;
    return diff;
  }, [profile, form]);

  const dirty = Object.keys(changes).length > 0;

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setNotice(null);
  };

  const save = async () => {
    if (!dirty || saving || !form) return;
    if ("fullName" in changes && !changes.fullName) {
      setNotice({ tone: "err", text: "Full name can't be empty." });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const updated = (await courierApi.updateMe(changes)) as CourierProfile;
      const next = { ...(profile as CourierProfile), ...updated };
      setProfile(next);
      setForm(toForm(next));
      setNotice({ tone: "ok", text: "Your profile has been updated." });
    } catch (e) {
      setNotice({ tone: "err", text: errMessage(e, "Couldn't save your changes.") });
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    if (profile) setForm(toForm(profile));
    setNotice(null);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  const rating = Number(profile?.rating) || 0;
  const vehicles = vehicleOptions(profile?.vehicleType);
  const vehicleLabel = vehicles.find((v) => v.value === normalizeVehicle(profile?.vehicleType))?.label;

  return (
    <div className="min-h-full bg-app py-5 sm:py-8">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-28 sm:space-y-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div>
          <p className="eyebrow font-space text-emerald-700">Preferences</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">Settings</h1>
          <p className="mt-1.5 text-sm text-black/55 sm:text-base">
            Manage your profile, vehicle and availability.
          </p>
        </div>

        {loading && !profile ? (
          <Skeleton />
        ) : loadError && !profile ? (
          <div className="surface-card flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <IconAlertTriangle className="h-7 w-7" />
            </div>
            <p className="text-lg font-extrabold tracking-tight text-ink">Couldn&apos;t load your profile</p>
            <p className="mt-1 max-w-sm text-sm text-black/55">{loadError}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-bold text-white hover:bg-ink-soft"
            >
              <IconRefresh className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : profile && form ? (
          <>
            {/* Profile Preview Card */}
            <div className="surface-ink relative overflow-hidden p-5 sm:p-8">
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/25 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 hidden h-72 w-72 rounded-full border-[36px] border-white/5 sm:block" />
              <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-lime font-space text-2xl font-bold text-ink sm:h-20 sm:w-20 sm:text-3xl">
                  {profile.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(profile.name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">{profile.name || "Courier"}</h2>
                    {profile.isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-0.5 text-[11px] font-bold text-ink">
                        <IconShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/70">
                        Not verified yet
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <div className="flex items-center gap-1">
                      <IconStar className="h-4 w-4 text-lime" />
                      <span className="font-space font-bold">{rating > 0 ? rating.toFixed(1) : "New"}</span>
                      <span className="text-white/55">Rating</span>
                    </div>
                    <span className="text-white/30">·</span>
                    <span className="text-white/55">
                      <span className="font-space font-bold text-white">{profile.totalDeliveries ?? 0}</span>{" "}
                      {(profile.totalDeliveries ?? 0) === 1 ? "delivery" : "deliveries"}
                    </span>
                    {vehicleLabel && (
                      <>
                        <span className="text-white/30">·</span>
                        <span className="text-white/55">{vehicleLabel}</span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-white/45">Member since {fmtMonth(profile.memberSince)}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                    profile.isAvailable ? "bg-lime text-ink" : "bg-white/10 text-white/70"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${profile.isAvailable ? "bg-emerald-600" : "bg-white/40"}`} />
                  {profile.isAvailable ? "Available" : "Offline"}
                </span>
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="sticky top-[69px] z-10 -mx-4 flex gap-2 overflow-x-auto border-b border-black/5 bg-cream/85 px-4 py-2.5 backdrop-blur-md [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className={`flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
                    activeSection === section.id
                      ? "bg-ink text-white"
                      : "bg-white text-black/60 ring-1 ring-black/5 hover:text-ink hover:ring-black/20"
                  }`}
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </button>
              ))}
            </div>

            {notice && (
              <div
                role={notice.tone === "err" ? "alert" : "status"}
                className={`flex items-start gap-3 rounded-2xl p-4 text-sm ring-1 ${
                  notice.tone === "ok"
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20"
                    : "bg-red-50 text-red-700 ring-red-600/20"
                }`}
              >
                {notice.tone === "ok" ? (
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <p className="min-w-0 flex-1">{notice.text}</p>
              </div>
            )}

            {/* PROFILE */}
            <div id="account" className="scroll-mt-32 space-y-4 sm:space-y-6">
              <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl">Profile</h2>
              <SectionCard icon={IconUser} title="Personal Information">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" htmlFor="fullName">
                    <Input
                      id="fullName"
                      value={form.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      autoComplete="name"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Phone number" htmlFor="phone">
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      autoComplete="tel"
                      placeholder="+234…"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Email address" htmlFor="email" hint="Your login email can't be changed here.">
                    <Input
                      id="email"
                      type="email"
                      value={profile.email ?? ""}
                      readOnly
                      disabled
                      className={`${inputCls} cursor-not-allowed opacity-70`}
                    />
                  </Field>
                </div>
              </SectionCard>
            </div>

            {/* VEHICLE & AVAILABILITY */}
            <div id="work" className="scroll-mt-32 space-y-4 sm:space-y-6">
              <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl">Vehicle &amp; Availability</h2>

              <SectionCard icon={IconMotorbike} title="Vehicle">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Vehicle type" htmlFor="vehicleType">
                    <Select value={form.vehicleType || undefined} onValueChange={(v) => update("vehicleType", v)}>
                      <SelectTrigger id="vehicleType" className={`${inputCls} w-full px-4`}>
                        <SelectValue placeholder="Select your vehicle" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {vehicles.map((v) => (
                          <SelectItem key={v.value} value={v.value} className="rounded-xl py-2.5">
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field
                    label="License / plate number"
                    htmlFor="licenseNumber"
                    hint={form.vehicleType === "on_foot" || form.vehicleType === "bicycle" ? "Optional for your vehicle type." : undefined}
                  >
                    <Input
                      id="licenseNumber"
                      value={form.licenseNumber}
                      onChange={(e) => update("licenseNumber", e.target.value)}
                      placeholder="e.g. KJA 234 FG"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard icon={IconPower} title="Availability">
                <ToggleSwitch
                  checked={form.isAvailable}
                  onChange={(v) => update("isAvailable", v)}
                  label="Available for deliveries"
                  description={
                    form.isAvailable
                      ? "You'll see new delivery jobs and can accept them."
                      : "You're offline — new jobs won't be offered to you."
                  }
                  disabled={saving}
                />
              </SectionCard>
            </div>

            {/* Save bar */}
            <div
              className={`fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/95 px-4 py-3 backdrop-blur-md transition-transform duration-300 sm:px-6 lg:left-auto lg:right-6 lg:bottom-6 lg:rounded-full lg:border lg:px-3 lg:shadow-xl ${
                dirty ? "translate-y-0" : "pointer-events-none translate-y-[150%]"
              }`}
              aria-hidden={!dirty}
            >
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                <p className="hidden text-sm font-semibold text-ink sm:block lg:pl-3">You have unsaved changes</p>
                <div className="flex flex-1 gap-2 sm:flex-none">
                  <button
                    type="button"
                    onClick={cancel}
                    disabled={saving}
                    tabIndex={dirty ? 0 : -1}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-full border-2 border-ink/15 bg-white px-5 text-sm font-bold text-ink hover:border-ink disabled:opacity-50 sm:flex-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={saving}
                    tabIndex={dirty ? 0 : -1}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-white hover:bg-ink-soft disabled:opacity-60 sm:flex-none"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconCheck className="h-4 w-4" />}
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
