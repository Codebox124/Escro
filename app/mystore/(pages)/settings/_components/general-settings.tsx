"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  AlertCircle,
  CheckCircle,
  IconBuilding,
  IconCamera,
  IconClock,
  IconCurrency,
  IconCurrentLocation,
  IconMail,
  IconMapPin,
  IconPhone,
  IconTrash,
  IconUpload,
  IconWorld,
  Loader2,
} from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sellerService } from "@/services/seller";
import { useMoney } from "@/app/mystore/_components/currency";

const MiniMap = dynamic(() => import("@/components/ui/mini-map"), {
  ssr: false,
  loading: () => <div className="h-56 w-full animate-pulse rounded-2xl bg-cream sm:h-64" />,
});

type LatLng = { lat: number; lng: number };

type StoreSettings = {
  tagline: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  address: string | null;
  timezone: string | null;
  language: string | null;
  currency: string | null;
};

type Profile = {
  user: { email: string; phone: string };
  store: {
    name: string;
    description: string;
    logoUrl: string | null;
    settings?: StoreSettings;
  } | null;
  extendedSettings: boolean;
  /** exact pickup pin for couriers (requires migration 008) */
  storeLocation?: LatLng | null;
  mapsAvailable?: boolean;
};

type Form = {
  storeName: string;
  storeDescription: string;
  tagline: string;
  businessEmail: string;
  businessPhone: string;
  address: string;
  timezone: string;
  language: string;
  currency: string;
};

const DEFAULTS = { timezone: "africa-lagos", language: "en", currency: "ngn" };
const MAX_BYTES = 10 * 1024 * 1024;

const inputClass =
  "h-12 rounded-2xl border-black/10 bg-white shadow-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-lime-dark/60";
const selectClass =
  "h-12! w-full rounded-2xl border-black/10 bg-white shadow-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-lime-dark/60";

const toForm = (p: Profile): Form => {
  const s = p.store?.settings;
  return {
    storeName: p.store?.name || "",
    storeDescription: p.store?.description || "",
    tagline: s?.tagline || "",
    businessEmail: s?.businessEmail || p.user.email || "",
    businessPhone: s?.businessPhone || p.user.phone || "",
    address: s?.address || "",
    timezone: s?.timezone || DEFAULTS.timezone,
    language: s?.language || DEFAULTS.language,
    currency: s?.currency || DEFAULTS.currency,
  };
};

const samePin = (a: LatLng | null | undefined, b: LatLng | null | undefined) =>
  (!a && !b) || (!!a && !!b && Math.abs(a.lat - b.lat) < 1e-7 && Math.abs(a.lng - b.lng) < 1e-7);

const geoErrorMessage = (err: GeolocationPositionError | null) => {
  if (!err) return "Your browser doesn't support location. Drag the pin or tap the map instead.";
  if (err.code === err.PERMISSION_DENIED)
    return "Location access was blocked. Allow it in your browser settings, or tap the map to drop the pin.";
  if (err.code === err.TIMEOUT) return "Finding your location took too long. Please try again.";
  return "We couldn't find your location right now. Tap the map to drop the pin instead.";
};

const errorMessage = (err: unknown, fallback: string) =>
  (typeof err === "object" && err && "message" in err && String((err as { message: unknown }).message)) ||
  fallback;

const GeneralSettings = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { setCurrency } = useMoney();
  const [pin, setPin] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [fitKey, setFitKey] = useState(0);

  const hydrate = (p: Profile) => {
    setProfile(p);
    setForm(toForm(p));
    setPin(p.storeLocation || null);
    setGeoError(null);
    setLogoFile(null);
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const load = async () => {
    try {
      setLoading(true);
      hydrate(await sellerService.getProfile());
    } catch (err) {
      setNotice({ type: "error", text: errorMessage(err, "Failed to load store settings") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (notice?.type !== "success") return;
    const id = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(id);
  }, [notice]);

  const original = useMemo(() => (profile ? toForm(profile) : null), [profile]);
  const pinDirty = !!profile?.mapsAvailable && !samePin(pin, profile.storeLocation);
  const dirty =
    !!form &&
    !!original &&
    (logoFile !== null || pinDirty || (Object.keys(form) as (keyof Form)[]).some((k) => form[k] !== original[k]));

  const locate = () => {
    setGeoError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError(geoErrorMessage(null));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setFitKey((k) => k + 1);
      },
      (err) => {
        setLocating(false);
        setGeoError(geoErrorMessage(err));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const pickLogo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice({ type: "error", text: "Please choose an image file" });
      return;
    }
    if (file.size > MAX_BYTES) {
      setNotice({ type: "error", text: "Images must be smaller than 10MB" });
      return;
    }
    setLogoFile(file);
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const save = async () => {
    if (!form || !profile) return;
    if (!form.storeName.trim()) {
      setNotice({ type: "error", text: "Store name is required" });
      return;
    }
    const data = new FormData();
    data.append("storeName", form.storeName.trim());
    data.append("storeDescription", form.storeDescription.trim());
    if (profile.extendedSettings) {
      (["tagline", "businessEmail", "businessPhone", "address", "timezone", "language", "currency"] as const).forEach(
        (k) => data.append(k, form[k])
      );
    }
    if (logoFile) data.append("logo", logoFile);
    if (pinDirty) {
      // "" clears the pin
      data.append("storeLat", pin ? String(pin.lat) : "");
      data.append("storeLng", pin ? String(pin.lng) : "");
    }

    try {
      setSaving(true);
      setNotice(null);
      const updated = await sellerService.updateProfile(data);
      hydrate(updated);
      if (updated?.store?.settings?.currency) setCurrency(updated.store.settings.currency);
      setNotice({ type: "success", text: "Store settings saved" });
    } catch (err) {
      setNotice({ type: "error", text: errorMessage(err, "Could not save settings") });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form || !profile) {
    return (
      <div className="space-y-4 sm:space-y-6" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-3xl bg-white ring-1 ring-black/5" />
        ))}
      </div>
    );
  }

  const logoSrc = logoPreview || profile.store?.logoUrl;
  const extrasLocked = !profile.extendedSettings;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Store Branding */}
      <div className="surface-card p-5 sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-3 text-lg font-extrabold tracking-[-0.02em] text-ink sm:text-xl">
            <IconBuilding className="h-10 w-10 shrink-0 rounded-xl bg-cream p-2.5 text-ink" />
            Store Branding
          </h3>
          <Link
            href="/mystore/profile"
            className="text-sm font-bold text-ink underline decoration-lime-dark decoration-2 underline-offset-4"
          >
            View store profile
          </Link>
        </div>

        <div className="grid gap-6">
          {/* Store Logo */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            <input
              ref={fileRef}
              type="file"
              id="logo-upload"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                pickLogo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <div className="relative w-fit">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-ink/15 bg-cream">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoSrc} alt="Store logo" className="h-full w-full object-cover" />
                ) : (
                  <IconCamera className="h-8 w-8 text-ink/30" />
                )}
              </div>
              <label
                htmlFor="logo-upload"
                className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-lime shadow-md ring-4 ring-white transition-colors hover:bg-lime-dark"
              >
                <IconUpload className="h-4 w-4 text-ink" />
                <span className="sr-only">Upload logo</span>
              </label>
            </div>
            <div className="min-w-0 flex-1">
              <Label className="text-sm font-bold text-ink">Store Logo</Label>
              <p className="mb-3 mt-1 text-sm text-black/55">
                Shown on your storefront and products. Square images work best.
              </p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-ink/15 px-4 text-sm font-bold text-ink transition hover:border-ink"
              >
                <IconUpload className="h-4 w-4" />
                {logoSrc ? "Change Logo" : "Upload Logo"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="store-name" className="text-sm font-bold text-ink">
                Store Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="store-name"
                placeholder="Your store name"
                value={form.storeName}
                onChange={(e) => set("storeName", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline" className="text-sm font-bold text-ink">
                Tagline
              </Label>
              <Input
                id="tagline"
                placeholder="A short line about your store"
                value={form.tagline}
                disabled={extrasLocked}
                onChange={(e) => set("tagline", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-bold text-ink">
              Store Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your store..."
              maxLength={500}
              value={form.storeDescription}
              onChange={(e) => set("storeDescription", e.target.value)}
              className="min-h-[100px] rounded-2xl border-black/10 bg-white shadow-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-lime-dark/60"
            />
            <p className="text-xs text-black/55">
              This description will appear on your store&apos;s public page.
            </p>
          </div>
        </div>
      </div>

      {extrasLocked && (
        <div className="flex items-start gap-3 rounded-3xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200 sm:p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Tagline, contact and regional settings need a one-time database update. Run{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5 font-space text-xs">
              backend/database/migrations/001_store_settings.sql
            </code>{" "}
            in the Supabase SQL editor, then reload this page.
          </p>
        </div>
      )}

      {/* Contact Information */}
      <fieldset disabled={extrasLocked} className="surface-card p-5 disabled:opacity-60 sm:p-6">
        <h3 className="mb-6 flex items-center gap-3 text-lg font-extrabold tracking-[-0.02em] text-ink sm:text-xl">
          <IconMail className="h-10 w-10 shrink-0 rounded-xl bg-cream p-2.5 text-ink" />
          Contact Information
        </h3>

        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="business-email" className="text-sm font-bold text-ink">
                Business Email
              </Label>
              <div className="relative">
                <IconMail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40" />
                <Input
                  id="business-email"
                  type="email"
                  placeholder="contact@yourstore.com"
                  value={form.businessEmail}
                  onChange={(e) => set("businessEmail", e.target.value)}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-phone" className="text-sm font-bold text-ink">
                Phone Number
              </Label>
              <div className="relative">
                <IconPhone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40" />
                <Input
                  id="business-phone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={form.businessPhone}
                  onChange={(e) => set("businessPhone", e.target.value)}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-bold text-ink">
              Business Address
            </Label>
            <div className="relative">
              <IconMapPin className="absolute left-3 top-3 h-5 w-5 text-black/40" />
              <Textarea
                id="address"
                placeholder="Enter your business address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className="min-h-[80px] rounded-2xl border-black/10 bg-white pl-10 shadow-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-lime-dark/60"
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Store pickup location */}
      <div className="surface-card p-5 sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <IconMapPin className="h-10 w-10 shrink-0 rounded-xl bg-cream p-2.5 text-ink" />
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink sm:text-xl">Store pickup location</h3>
            <p className="mt-0.5 text-sm text-black/55">
              Couriers use this pin to find your store. Drop it exactly where parcels should be collected.
            </p>
          </div>
        </div>

        {!profile.mapsAvailable ? (
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Run{" "}
              <code className="rounded bg-white/70 px-1.5 py-0.5 font-space text-xs">
                backend/database/migrations/008_maps.sql
              </code>{" "}
              in Supabase to enable store pins.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={locate}
                disabled={locating || saving}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white transition hover:bg-ink-soft disabled:opacity-60"
              >
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconCurrentLocation className="h-4 w-4" />}
                Use my current location
              </button>
              {pin && (
                <button
                  type="button"
                  onClick={() => setPin(null)}
                  disabled={saving}
                  className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink/15 px-4 text-sm font-bold text-ink transition hover:border-red-500 hover:text-red-600 disabled:opacity-60"
                >
                  <IconTrash className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>

            {geoError && (
              <p role="alert" className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-600/20">
                {geoError}
              </p>
            )}

            <MiniMap
              markers={pin ? [{ lat: pin.lat, lng: pin.lng, kind: "pin", label: form.storeName.trim() || "Your store" }] : []}
              onPinChange={setPin}
              fitKey={fitKey}
            />
            <p className="text-xs text-black/55">
              {pin ? (
                <>
                  Drag the pin or tap the map to adjust.{" "}
                  <span className="font-space text-black/40">
                    {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                  </span>
                </>
              ) : (
                "No pin yet — use your current location or tap the map to drop one."
              )}
              {pinDirty && <span className="ml-1 font-semibold text-ink">Unsaved — press Save Changes.</span>}
            </p>
          </div>
        )}
      </div>

      {/* Regional Settings */}
      <fieldset disabled={extrasLocked} className="surface-card p-5 disabled:opacity-60 sm:p-6">
        <h3 className="mb-6 flex items-center gap-3 text-lg font-extrabold tracking-[-0.02em] text-ink sm:text-xl">
          <IconWorld className="h-10 w-10 shrink-0 rounded-xl bg-cream p-2.5 text-ink" />
          Regional Settings
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
              <IconClock className="h-4 w-4 text-black/55" />
              Timezone
            </Label>
            <Select value={form.timezone} onValueChange={(v) => set("timezone", v)} disabled={extrasLocked}>
              <SelectTrigger className={selectClass}>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="africa-lagos">(UTC+01:00) Lagos</SelectItem>
                <SelectItem value="africa-nairobi">(UTC+03:00) Nairobi</SelectItem>
                <SelectItem value="africa-johannesburg">(UTC+02:00) Johannesburg</SelectItem>
                <SelectItem value="europe-london">(UTC+00:00) London</SelectItem>
                <SelectItem value="europe-paris">(UTC+01:00) Paris, Berlin</SelectItem>
                <SelectItem value="america-new-york">(UTC-05:00) Eastern Time</SelectItem>
                <SelectItem value="america-chicago">(UTC-06:00) Central Time</SelectItem>
                <SelectItem value="america-denver">(UTC-07:00) Mountain Time</SelectItem>
                <SelectItem value="america-los-angeles">(UTC-08:00) Pacific Time</SelectItem>
                <SelectItem value="asia-tokyo">(UTC+09:00) Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
              <IconWorld className="h-4 w-4 text-black/55" />
              Language
            </Label>
            <Select value={form.language} onValueChange={(v) => set("language", v)} disabled={extrasLocked}>
              <SelectTrigger className={selectClass}>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
              <IconCurrency className="h-4 w-4 text-black/55" />
              Currency
            </Label>
            <Select value={form.currency} onValueChange={(v) => set("currency", v)} disabled={extrasLocked}>
              <SelectTrigger className={selectClass}>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ngn">NGN (₦)</SelectItem>
                <SelectItem value="usd">USD ($)</SelectItem>
                <SelectItem value="eur">EUR (€)</SelectItem>
                <SelectItem value="gbp">GBP (£)</SelectItem>
                <SelectItem value="cad">CAD (C$)</SelectItem>
                <SelectItem value="aud">AUD (A$)</SelectItem>
                <SelectItem value="jpy">JPY (¥)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        {notice && (
          <p
            role="status"
            className={`mr-auto flex items-center gap-2 text-sm font-semibold ${
              notice.type === "success" ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {notice.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {notice.text}
          </p>
        )}
        <button
          type="button"
          onClick={() => profile && hydrate(profile)}
          disabled={!dirty || saving}
          className="h-11 rounded-full border-2 border-ink/15 px-6 text-sm font-bold text-ink transition hover:border-ink disabled:opacity-40 disabled:hover:border-ink/15"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="h-11 rounded-full bg-ink px-6 text-sm font-bold text-white transition hover:bg-ink-soft disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default GeneralSettings;
