"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  IconBuilding,
  IconCamera,
  IconMail,
  IconMapPin,
  IconPhone,
  IconUpload,
  IconWorld,
  Loader2,
  X,
} from "@/components/icons";
import { agencyApi } from "@/services/agency";
import { btnPrimary, btnSecondary, cardTitle, inputBase } from "../ui";
import { AgencyMigrationNotice, AgencyProfile, LoadError, agencyError } from "../agents/shared";

const MAX_LOGO_BYTES = 10 * 1024 * 1024;

type TextField = "companyName" | "contactPerson" | "registration" | "description" | "phone" | "email" | "address" | "website";
const TEXT_FIELDS: TextField[] = ["companyName", "contactPerson", "registration", "description", "phone", "email", "address", "website"];
const EXTENDED: TextField[] = ["description", "phone", "email", "address", "website"];

type FormState = Record<TextField, string> & { serviceAreas: string[] };

function toForm(p: AgencyProfile): FormState {
  return {
    companyName: p.companyName || "",
    contactPerson: p.contactPerson || "",
    registration: p.registration || "",
    description: p.description || "",
    phone: p.phone || "",
    email: p.email || "",
    address: p.address || "",
    website: p.website || "",
    serviceAreas: Array.isArray(p.serviceAreas) ? p.serviceAreas : [],
  };
}

function mergeAreas(current: string[], raw: string) {
  const next = [...current];
  for (const p of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (!next.some((a) => a.toLowerCase() === p.toLowerCase())) next.push(p);
  }
  return next.slice(0, 50);
}

const labelCls = "flex flex-col gap-1.5 text-sm font-semibold text-black/70";
const textareaCls = "min-h-[100px] w-full rounded-2xl border-0 bg-white px-4 py-3 text-sm text-ink ring-1 ring-black/10 placeholder:text-black/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:bg-cream/60 disabled:text-black/40";
const inputCls = `${inputBase} disabled:cursor-not-allowed disabled:bg-cream/60 disabled:text-black/40`;

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h3 className={`mb-5 flex items-center gap-2.5 ${cardTitle}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cream"><Icon className="h-4 w-4 text-ink" /></span>
      {children}
    </h3>
  );
}

interface GeneralSettingsProps {
  profile: AgencyProfile;
  onSaved: (p: AgencyProfile) => void;
}

const GeneralSettings = ({ profile, onSaved }: GeneralSettingsProps) => {
  const initial = useMemo(() => toForm(profile), [profile]);
  const [form, setForm] = useState<FormState>(initial);
  const [areaDraft, setAreaDraft] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const extended = profile.extendedProfile !== false;

  // When the saved profile comes back from the server, re-base the form on it.
  const [baseProfile, setBaseProfile] = useState(profile);
  if (baseProfile !== profile) {
    setBaseProfile(profile);
    setForm(toForm(profile));
  }

  // Revoke object URLs when the preview changes / unmounts.
  useEffect(() => () => { if (logoPreview) URL.revokeObjectURL(logoPreview); }, [logoPreview]);

  const changed = useMemo(() => {
    const out: Partial<FormState> = {};
    for (const k of TEXT_FIELDS) if (form[k].trim() !== initial[k].trim()) out[k] = form[k].trim();
    if (form.serviceAreas.join("|") !== initial.serviceAreas.join("|")) out.serviceAreas = form.serviceAreas;
    return out;
  }, [form, initial]);
  const dirty = Object.keys(changed).length > 0 || !!logoFile;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    if (error) setError(null);
  }

  function addAreas(raw: string) {
    if (!raw.trim()) return;
    set("serviceAreas", mergeAreas(form.serviceAreas, raw));
    setAreaDraft("");
  }

  function onAreaKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addAreas(areaDraft);
    } else if (e.key === "Backspace" && !areaDraft && form.serviceAreas.length) {
      set("serviceAreas", form.serviceAreas.slice(0, -1));
    }
  }

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setLogoError("Choose an image file (PNG, JPG, WebP…)."); return; }
    if (file.size > MAX_LOGO_BYTES) { setLogoError("Logo must be 10MB or smaller."); return; }
    setLogoError(null);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setSaved(false);
  }

  function cancel() {
    setForm(initial);
    setAreaDraft("");
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError(null);
    setError(null);
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.companyName.trim()) { setError("Company name cannot be empty."); return; }
    const payload: Record<string, string | string[]> = { ...changed } as Record<string, string | string[]>;
    // Include an area that was typed but not yet turned into a chip.
    if (areaDraft.trim()) {
      const areas = mergeAreas(form.serviceAreas, areaDraft);
      setForm((f) => ({ ...f, serviceAreas: areas }));
      setAreaDraft("");
      if (areas.join("|") !== initial.serviceAreas.join("|")) payload.serviceAreas = areas;
    }
    if (!Object.keys(payload).length && !logoFile) return;
    if (!extended) for (const k of EXTENDED) delete payload[k];

    setSaving(true);
    setError(null);
    try {
      let body: FormData | Record<string, string | string[]> = payload;
      if (logoFile && extended) {
        const fd = new FormData();
        for (const [k, v] of Object.entries(payload)) fd.append(k, Array.isArray(v) ? v.join(",") : v);
        fd.append("logo", logoFile);
        body = fd;
      }
      const fresh: AgencyProfile = await agencyApi.updateProfile(body);
      setLogoFile(null);
      setLogoPreview(null);
      setSaved(true);
      onSaved(fresh);
    } catch (err) {
      setError(agencyError(err, "Could not save your changes."));
    } finally {
      setSaving(false);
    }
  }

  const logoSrc = logoPreview || profile.logo;

  return (
    <form onSubmit={save} className="space-y-4 pb-2 sm:space-y-6">
      {!extended && (
        <AgencyMigrationNotice>Until then, description, contact details, website and logo can’t be edited.</AgencyMigrationNotice>
      )}

      {/* Branding */}
      <div className="surface-card p-4 sm:p-6">
        <SectionTitle icon={IconBuilding}>Agency profile</SectionTitle>
        <div className="grid gap-5">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-ink/20 bg-cream">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoSrc} alt="Agency logo" className="h-full w-full object-cover" />
                ) : (
                  <IconCamera className="h-8 w-8 text-black/30" />
                )}
              </div>
              {logoPreview && (
                <button type="button" aria-label="Discard new logo" onClick={() => { setLogoFile(null); setLogoPreview(null); }} className="absolute -right-2 -top-2 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white text-ink shadow ring-1 ring-black/10 hover:bg-cream">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-black/70">Agency logo</p>
              <p className="mb-3 mt-1 text-sm text-black/55">Square image, up to 10MB. Shown to clients on your services.</p>
              <label className={`${btnSecondary} h-10 ${extended ? "" : "pointer-events-none opacity-50"}`}>
                <IconUpload className="h-4 w-4" />
                {logoSrc ? "Change logo" : "Upload logo"}
                <input type="file" accept="image/*" className="sr-only" disabled={!extended || saving} onChange={onLogo} />
              </label>
              {logoError && <p role="alert" className="mt-2 text-xs font-semibold text-red-600">{logoError}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelCls}>
              <span>Company name <span className="text-red-500">*</span></span>
              <input className={inputCls} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="Your agency name" maxLength={255} required />
            </label>
            <label className={labelCls}>
              Contact person
              <input className={inputCls} value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} placeholder="Who clients should ask for" />
            </label>
            <label className={labelCls}>
              Registration number
              <input className={inputCls} value={form.registration} onChange={(e) => set("registration", e.target.value)} placeholder="e.g. RC 1234567" />
            </label>
            <div className={labelCls}>
              <label htmlFor="service-area-input">Service areas</label>
              <div className="flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-2xl bg-white px-2 py-1.5 ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-ink">
                {form.serviceAreas.map((area) => (
                  <span key={area} className="inline-flex items-center gap-1 rounded-full bg-cream py-1 pl-3 pr-1 text-xs font-bold text-ink">
                    {area}
                    <button type="button" aria-label={`Remove ${area}`} onClick={() => set("serviceAreas", form.serviceAreas.filter((a) => a !== area))} className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-black/50 hover:bg-white hover:text-ink">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  id="service-area-input"
                  value={areaDraft}
                  onChange={(e) => setAreaDraft(e.target.value)}
                  onKeyDown={onAreaKey}
                  onBlur={() => addAreas(areaDraft)}
                  placeholder={form.serviceAreas.length ? "Add another…" : "e.g. Lagos, Ikeja, Lekki"}
                  className="h-8 min-w-[8rem] flex-1 bg-transparent px-2 text-sm font-normal text-ink placeholder:text-black/40 focus:outline-none"
                />
              </div>
              <span className="text-xs font-normal text-black/50">Press Enter or comma to add each area.</span>
            </div>
          </div>

          <label className={labelCls}>
            Description
            <textarea className={textareaCls} value={form.description} onChange={(e) => set("description", e.target.value)} disabled={!extended} placeholder="What does your agency do? Who do you serve?" />
          </label>
        </div>
      </div>

      {/* Contact */}
      <div className="surface-card p-4 sm:p-6">
        <SectionTitle icon={IconMail}>Contact information</SectionTitle>
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelCls}>
              Business email
              <span className="relative">
                <IconMail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                <input type="email" className={`${inputCls} pl-10`} value={form.email} onChange={(e) => set("email", e.target.value)} disabled={!extended} placeholder="contact@youragency.com" />
              </span>
            </label>
            <label className={labelCls}>
              Phone number
              <span className="relative">
                <IconPhone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                <input type="tel" className={`${inputCls} pl-10`} value={form.phone} onChange={(e) => set("phone", e.target.value)} disabled={!extended} placeholder="+234 800 000 0000" />
              </span>
            </label>
          </div>
          <label className={labelCls}>
            Website
            <span className="relative">
              <IconWorld className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
              <input type="url" className={`${inputCls} pl-10`} value={form.website} onChange={(e) => set("website", e.target.value)} disabled={!extended} placeholder="https://youragency.com" />
            </span>
          </label>
          <label className={labelCls}>
            Business address
            <span className="relative">
              <IconMapPin className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-black/40" />
              <textarea className={`${textareaCls} min-h-[80px] pl-10`} value={form.address} onChange={(e) => set("address", e.target.value)} disabled={!extended} placeholder="Street, city, state" />
            </span>
          </label>
        </div>
      </div>

      {error && <LoadError error={error} />}

      {/* Actions */}
      <div className="sticky bottom-20 z-10 flex flex-col-reverse gap-2 rounded-3xl bg-cream/90 p-2 backdrop-blur sm:static sm:flex-row sm:items-center sm:justify-end sm:bg-transparent sm:p-0 sm:backdrop-blur-none lg:bottom-4">
        {saved && !dirty && (
          <span role="status" className="flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-700 sm:mr-auto">
            <CheckCircle2 size={16} /> Changes saved
          </span>
        )}
        <button type="button" onClick={cancel} disabled={!dirty || saving} className={btnSecondary}>Cancel</button>
        <button type="submit" disabled={!dirty || saving} className={btnPrimary}>
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
};

export default GeneralSettings;
