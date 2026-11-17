"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  IconTruck,
  IconMapPin,
  IconClock,
  IconGift,
  IconPlus,
  IconTrash,
  IconEdit,
  IconCheck,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sellerService } from "@/services/seller";
import { useMoney } from "@/app/mystore/_components/currency";

/** Shape stored in stores.shipping_settings (jsonb). */
export type ShippingMethod = {
  id: string;
  name: string;
  rate: number;
  estimatedDays: string; // e.g. "1-2"
  enabled: boolean;
};

export type ShippingSettingsData = {
  methods: ShippingMethod[];
  carriers: string[];
  shipsTo: "local" | "nationwide" | "international";
  processingTime: "same-day" | "1" | "1-2" | "2-3" | "3-5";
  cutoffTime: "10:00" | "12:00" | "14:00" | "16:00";
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
};

type MethodForm = Omit<ShippingMethod, "rate"> & { rate: string };
type Form = Omit<ShippingSettingsData, "methods" | "freeShippingThreshold"> & {
  methods: MethodForm[];
  freeShippingThreshold: string;
};

const CARRIERS = [
  { id: "gig", name: "GIG Logistics" },
  { id: "dhl", name: "DHL" },
  { id: "kwik", name: "Kwik Delivery" },
  { id: "sendbox", name: "Sendbox" },
  { id: "dispatch", name: "Local dispatch rider" },
  { id: "pickup", name: "Customer pickup" },
];

const SHIPS_TO = ["local", "nationwide", "international"] as const;
const PROCESSING = ["same-day", "1", "1-2", "2-3", "3-5"] as const;
const CUTOFFS = ["10:00", "12:00", "14:00", "16:00"] as const;

const DEFAULTS: ShippingSettingsData = {
  methods: [],
  carriers: [],
  shipsTo: "nationwide",
  processingTime: "1-2",
  cutoffTime: "14:00",
  freeShippingEnabled: false,
  freeShippingThreshold: 0,
};

const inputClass =
  "h-12 rounded-2xl border-black/10 bg-white shadow-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-lime-dark/60";
const selectClass =
  "h-12! w-full rounded-2xl border-black/10 bg-white shadow-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-lime-dark/60";
const checkboxClass =
  "mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-ink focus-visible:ring-2 focus-visible:ring-lime-dark/60";

const pick = <T,>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;
const num = (v: unknown, fallback: number) => {
  const n = Number(v);
  return v !== null && v !== "" && Number.isFinite(n) ? n : fallback;
};
const newId = () => `m_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const toForm = (raw: Record<string, unknown> | null | undefined): Form => {
  const s = raw || {};
  const methods = Array.isArray(s.methods)
    ? (s.methods as Record<string, unknown>[])
        .filter((m) => m && typeof m === "object")
        .map((m) => ({
          id: typeof m.id === "string" && m.id ? m.id : newId(),
          name: typeof m.name === "string" ? m.name : "",
          rate: String(num(m.rate, 0)),
          estimatedDays: typeof m.estimatedDays === "string" ? m.estimatedDays : "",
          enabled: typeof m.enabled === "boolean" ? m.enabled : true,
        }))
    : [];
  return {
    methods,
    carriers: Array.isArray(s.carriers)
      ? (s.carriers as unknown[]).filter((c): c is string => typeof c === "string")
      : DEFAULTS.carriers,
    shipsTo: pick(s.shipsTo, SHIPS_TO, DEFAULTS.shipsTo),
    processingTime: pick(s.processingTime, PROCESSING, DEFAULTS.processingTime),
    cutoffTime: pick(s.cutoffTime, CUTOFFS, DEFAULTS.cutoffTime),
    freeShippingEnabled: typeof s.freeShippingEnabled === "boolean" ? s.freeShippingEnabled : false,
    freeShippingThreshold: String(num(s.freeShippingThreshold, DEFAULTS.freeShippingThreshold)),
  };
};

const errorMessage = (err: unknown, fallback: string) =>
  (typeof err === "object" && err && "message" in err && String((err as { message: unknown }).message)) ||
  fallback;

const ShippingSettings = () => {
  const [available, setAvailable] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saved, setSaved] = useState<Form | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { symbol, format } = useMoney();

  const hydrate = (raw: Record<string, unknown> | null | undefined) => {
    const next = toForm(raw);
    setSaved(next);
    setForm(next);
    setEditingId(null);
  };

  useEffect(() => {
    let cancelled = false;
    sellerService
      .getSettings()
      .then((s: { available: boolean; shipping: Record<string, unknown> }) => {
        if (cancelled) return;
        setAvailable(s.available !== false);
        hydrate(s.shipping);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        hydrate(null);
        setLoadFailed(true);
        setNotice({ type: "error", text: errorMessage(err, "Failed to load shipping settings") });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (notice?.type !== "success") return;
    const id = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(id);
  }, [notice]);

  const dirty = useMemo(
    () => !!form && !!saved && JSON.stringify(form) !== JSON.stringify(saved),
    [form, saved]
  );

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const updateMethod = (id: string, patch: Partial<MethodForm>) =>
    setForm((f) => (f ? { ...f, methods: f.methods.map((m) => (m.id === id ? { ...m, ...patch } : m)) } : f));

  const addMethod = () => {
    const id = newId();
    setForm((f) =>
      f ? { ...f, methods: [...f.methods, { id, name: "", rate: "0", estimatedDays: "", enabled: true }] } : f
    );
    setEditingId(id);
  };

  const removeMethod = (id: string) => {
    setForm((f) => (f ? { ...f, methods: f.methods.filter((m) => m.id !== id) } : f));
    if (editingId === id) setEditingId(null);
  };

  const toggleCarrier = (id: string) =>
    setForm((f) =>
      f
        ? {
            ...f,
            carriers: f.carriers.includes(id) ? f.carriers.filter((c) => c !== id) : [...f.carriers, id],
          }
        : f
    );

  const validate = (f: Form): string | null => {
    for (const m of f.methods) {
      if (!m.name.trim()) return "Every delivery option needs a name";
      const rate = Number(m.rate);
      if (m.rate === "" || !Number.isFinite(rate) || rate < 0)
        return `Rate for "${m.name.trim()}" must be 0 or more`;
    }
    if (f.freeShippingEnabled) {
      const t = Number(f.freeShippingThreshold);
      if (f.freeShippingThreshold === "" || !Number.isFinite(t) || t < 0)
        return "Free shipping minimum must be 0 or more";
    }
    return null;
  };

  const save = async () => {
    if (!form) return;
    const problem = validate(form);
    if (problem) {
      setNotice({ type: "error", text: problem });
      return;
    }
    const payload: ShippingSettingsData = {
      ...form,
      methods: form.methods.map((m) => ({
        id: m.id,
        name: m.name.trim(),
        rate: Number(m.rate),
        estimatedDays: m.estimatedDays.trim(),
        enabled: m.enabled,
      })),
      freeShippingThreshold: Number(form.freeShippingThreshold || 0),
    };
    try {
      setSaving(true);
      setNotice(null);
      const result = await sellerService.updateShippingSettings(payload);
      hydrate(result || payload);
      setNotice({ type: "success", text: "Shipping settings saved" });
    } catch (err) {
      setNotice({ type: "error", text: errorMessage(err, "Could not save shipping settings") });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="space-y-4 sm:space-y-6" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-3xl bg-white ring-1 ring-black/5" />
        ))}
      </div>
    );
  }

  // Don't let a failed load overwrite stored settings with defaults.
  const locked = !available || loadFailed;

  return (
    <div className="space-y-4 sm:space-y-6">
      {!available && (
        <div className="flex items-start gap-3 rounded-3xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200 sm:p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Payment and shipping settings need a one-time database update. Run{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5 font-space text-xs">
              backend/database/migrations/002_store_payment_shipping.sql
            </code>{" "}
            in the Supabase SQL editor, then reload this page.
          </p>
        </div>
      )}

      <fieldset disabled={locked} className="space-y-4 disabled:opacity-60 sm:space-y-6">
        {/* Delivery Options */}
        <div className="surface-card p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-3 text-lg font-extrabold tracking-[-0.02em] text-ink sm:text-xl">
              <IconMapPin className="h-10 w-10 shrink-0 rounded-xl bg-cream p-2.5 text-ink" />
              Delivery Options & Rates
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMethod}
              className="h-10 rounded-full border-2 border-ink/15 px-4 font-bold text-ink shadow-none hover:border-ink hover:bg-transparent"
            >
              <IconPlus className="h-4 w-4" />
              Add Option
            </Button>
          </div>

          {form.methods.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-black/10 bg-cream/60 px-4 py-8 text-center">
              <IconTruck className="mx-auto mb-2 h-8 w-8 text-black/30" />
              <p className="font-bold text-ink">No delivery options yet</p>
              <p className="mt-1 text-sm text-black/55">
                Add the ways you deliver orders, e.g. &quot;Within Lagos&quot; or &quot;Interstate&quot;, with a rate for each.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10">
              {form.methods.map((method) =>
                editingId === method.id ? (
                  <div key={method.id} className="grid gap-3 bg-cream/60 px-4 py-4 md:grid-cols-[1fr_10rem_9rem_auto] md:items-end">
                    <div className="space-y-1.5">
                      <Label htmlFor={`name-${method.id}`} className="text-xs font-bold text-ink">
                        Name
                      </Label>
                      <Input
                        id={`name-${method.id}`}
                        autoFocus
                        placeholder="e.g. Within Lagos"
                        maxLength={60}
                        value={method.name}
                        onChange={(e) => updateMethod(method.id, { name: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`rate-${method.id}`} className="text-xs font-bold text-ink">
                        Rate
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black/55">{symbol}</span>
                        <Input
                          id={`rate-${method.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={method.rate}
                          onChange={(e) => updateMethod(method.id, { rate: e.target.value })}
                          className={`${inputClass} pl-8`}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`days-${method.id}`} className="text-xs font-bold text-ink">
                        Business days
                      </Label>
                      <Input
                        id={`days-${method.id}`}
                        placeholder="e.g. 1-2"
                        maxLength={10}
                        value={method.estimatedDays}
                        onChange={(e) => updateMethod(method.id, { estimatedDays: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setEditingId(null)}
                        className="h-10 rounded-full bg-ink px-4 font-bold text-white hover:bg-ink-soft"
                      >
                        <IconCheck className="h-4 w-4" />
                        Done
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMethod(method.id)}
                        aria-label="Remove delivery option"
                        className="h-10 w-10 rounded-full p-0 text-black/55 hover:bg-white hover:text-red-600"
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div key={method.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className={`flex min-w-0 items-center gap-3 ${method.enabled ? "" : "opacity-50"}`}>
                      <IconTruck className="h-5 w-5 shrink-0 text-black/40" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{method.name || "Untitled option"}</p>
                        <p className="text-sm text-black/55">
                          {method.estimatedDays ? `${method.estimatedDays} business days` : "Delivery time not set"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 sm:gap-3">
                      <span className="font-semibold text-ink">
                        {Number(method.rate) === 0 ? "Free" : format(method.rate)}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={method.enabled}
                        aria-label={`${method.enabled ? "Disable" : "Enable"} ${method.name || "option"}`}
                        onClick={() => updateMethod(method.id, { enabled: !method.enabled })}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
                          method.enabled ? "bg-ink" : "bg-black/15"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                            method.enabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(method.id)}
                        aria-label="Edit delivery option"
                        className="h-8 w-8 rounded-full p-0 text-black/40 hover:text-ink"
                      >
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMethod(method.id)}
                        aria-label="Remove delivery option"
                        className="h-8 w-8 rounded-full p-0 text-black/40 hover:text-red-600"
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Delivery Carriers */}
        <div className="surface-card p-5 sm:p-6">
          <h3 className="mb-6 flex items-center gap-3 text-lg font-extrabold tracking-[-0.02em] text-ink sm:text-xl">
            <IconTruck className="h-10 w-10 shrink-0 rounded-xl bg-cream p-2.5 text-ink" />
            Delivery Carriers
          </h3>

          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-3">
            {CARRIERS.map((carrier) => {
              const checked = form.carriers.includes(carrier.id);
              return (
                <label
                  key={carrier.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3.5 transition-colors hover:border-ink ${
                    checked ? "border-ink bg-lime/15" : "border-black/10 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCarrier(carrier.id)}
                    className={checkboxClass}
                  />
                  <span className="text-sm font-medium text-black/70">{carrier.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Handling Time */}
        <div className="surface-card p-5 sm:p-6">
          <h3 className="mb-6 flex items-center gap-3 text-lg font-extrabold tracking-[-0.02em] text-ink sm:text-xl">
            <IconClock className="h-10 w-10 shrink-0 rounded-xl bg-cream p-2.5 text-ink" />
            Handling & Coverage
          </h3>

          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-ink">Order Processing Time</Label>
              <Select
                value={form.processingTime}
                onValueChange={(v) => set("processingTime", v as Form["processingTime"])}
                disabled={locked}
              >
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="Select processing time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="same-day">Same Day</SelectItem>
                  <SelectItem value="1">1 Business Day</SelectItem>
                  <SelectItem value="1-2">1-2 Business Days</SelectItem>
                  <SelectItem value="2-3">2-3 Business Days</SelectItem>
                  <SelectItem value="3-5">3-5 Business Days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-black/55">Time needed to prepare and pack orders before shipment</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-ink">Same-Day Cutoff Time</Label>
              <Select
                value={form.cutoffTime}
                onValueChange={(v) => set("cutoffTime", v as Form["cutoffTime"])}
                disabled={locked}
              >
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="Select cutoff time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                  <SelectItem value="12:00">12:00 PM</SelectItem>
                  <SelectItem value="14:00">2:00 PM</SelectItem>
                  <SelectItem value="16:00">4:00 PM</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-black/55">Orders placed after this time are processed the next business day</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-ink">Ships To</Label>
              <Select
                value={form.shipsTo}
                onValueChange={(v) => set("shipsTo", v as Form["shipsTo"])}
                disabled={locked}
              >
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="Select coverage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">My city only</SelectItem>
                  <SelectItem value="nationwide">Anywhere in Nigeria</SelectItem>
                  <SelectItem value="international">Nigeria and abroad</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-black/55">Where you&apos;re able to deliver orders</p>
            </div>
          </div>
        </div>

        {/* Free Shipping */}
        <div className="surface-card p-5 sm:p-6">
          <h3 className="mb-6 flex items-center gap-3 text-lg font-extrabold tracking-[-0.02em] text-ink sm:text-xl">
            <IconGift className="h-10 w-10 shrink-0 rounded-xl bg-cream p-2.5 text-ink" />
            Free Shipping
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl bg-lime/25 p-4">
              <input
                type="checkbox"
                id="enable-free-shipping"
                checked={form.freeShippingEnabled}
                onChange={(e) => set("freeShippingEnabled", e.target.checked)}
                className={checkboxClass}
              />
              <label htmlFor="enable-free-shipping" className="text-sm text-black/70">
                <span className="font-medium">Enable free shipping threshold</span>
                <span className="mt-0.5 block text-black/55">
                  Offer free shipping on orders above a certain amount
                </span>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="free-shipping-threshold" className="text-sm font-bold text-ink">
                  Minimum Order Amount
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black/55">{symbol}</span>
                  <Input
                    id="free-shipping-threshold"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.freeShippingThreshold}
                    disabled={locked || !form.freeShippingEnabled}
                    onChange={(e) => set("freeShippingThreshold", e.target.value)}
                    className={`${inputClass} pl-8`}
                  />
                </div>
                {form.freeShippingEnabled && Number(form.freeShippingThreshold) > 0 && (
                  <p className="text-xs text-black/55">
                    Orders of {format(form.freeShippingThreshold)} or more ship free.
                  </p>
                )}
              </div>
            </div>
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
          onClick={() => {
            setForm(saved);
            setEditingId(null);
            setNotice(null);
          }}
          disabled={!dirty || saving || locked}
          className="h-11 rounded-full border-2 border-ink/15 px-6 text-sm font-bold text-ink transition hover:border-ink disabled:opacity-40 disabled:hover:border-ink/15"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving || locked}
          className="h-11 rounded-full bg-ink px-6 text-sm font-bold text-white transition hover:bg-ink-soft disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default ShippingSettings;
