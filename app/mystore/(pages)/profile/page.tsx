"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  Camera,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Package,
  Phone,
  Star,
  Store,
  TrendingUp,
  User,
} from "@/components/icons";
import { sellerService } from "@/services/seller";
import { authService } from "@/services/auth";
import { useMoney } from "@/app/mystore/_components/currency";

type Profile = {
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    role: string;
    avatarUrl: string | null;
    isVerified: boolean;
    memberSince: string;
  };
  store: {
    id: string;
    name: string;
    description: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    isVerified: boolean;
    totalSales: number;
    rating: number;
    totalReviews: number;
  } | null;
  stats: { products: number };
};

type ImageKey = "avatar" | "logo" | "banner";

const MAX_BYTES = 10 * 1024 * 1024;

const inputClass =
  "h-12 w-full rounded-2xl border-0 bg-white px-4 text-[15px] text-ink ring-1 ring-black/10 outline-none transition placeholder:text-black/35 hover:ring-black/20 focus:ring-2 focus:ring-ink disabled:bg-cream disabled:text-black/50";
const labelClass = "mb-2 block text-sm font-semibold text-ink";

const errorMessage = (err: unknown, fallback: string) =>
  (typeof err === "object" && err && "message" in err && String((err as { message: unknown }).message)) ||
  fallback;

const initials = (name?: string) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // editable fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [files, setFiles] = useState<Partial<Record<ImageKey, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<ImageKey, string>>>({});

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { format } = useMoney();

  const inputs = {
    avatar: useRef<HTMLInputElement>(null),
    logo: useRef<HTMLInputElement>(null),
    banner: useRef<HTMLInputElement>(null),
  };

  const hydrate = (p: Profile) => {
    setProfile(p);
    setFullName(p.user.fullName || "");
    setPhone(p.user.phone || "");
    setStoreName(p.store?.name || "");
    setStoreDescription(p.store?.description || "");
    setFiles({});
    setPreviews((prev) => {
      Object.values(prev).forEach((url) => url && URL.revokeObjectURL(url));
      return {};
    });
  };

  const load = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      hydrate(await sellerService.getProfile());
    } catch (err) {
      setLoadError(errorMessage(err, "Failed to load your profile"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const dirty = useMemo(() => {
    if (!profile) return false;
    return (
      fullName !== (profile.user.fullName || "") ||
      phone !== (profile.user.phone || "") ||
      storeName !== (profile.store?.name || "") ||
      storeDescription !== (profile.store?.description || "") ||
      Object.keys(files).length > 0
    );
  }, [profile, fullName, phone, storeName, storeDescription, files]);

  const pickImage = (key: ImageKey, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast({ type: "error", text: "Please choose an image file" });
      return;
    }
    if (file.size > MAX_BYTES) {
      setToast({ type: "error", text: "Images must be smaller than 10MB" });
      return;
    }
    setFiles((f) => ({ ...f, [key]: file }));
    setPreviews((p) => {
      if (p[key]) URL.revokeObjectURL(p[key]!);
      return { ...p, [key]: URL.createObjectURL(file) };
    });
  };

  const handleSave = async () => {
    if (!profile) return;
    if (!fullName.trim()) {
      setToast({ type: "error", text: "Full name cannot be empty" });
      return;
    }
    if (!storeName.trim()) {
      setToast({ type: "error", text: "Store name cannot be empty" });
      return;
    }

    const data = new FormData();
    data.append("fullName", fullName.trim());
    data.append("phone", phone.trim());
    data.append("storeName", storeName.trim());
    data.append("storeDescription", storeDescription.trim());
    (Object.keys(files) as ImageKey[]).forEach((k) => data.append(k, files[k]!));

    try {
      setSaving(true);
      const updated: Profile = await sellerService.updateProfile(data);
      hydrate(updated);

      // keep the cached user (navbar, greetings) in sync
      const cached = authService.getUser();
      const token = authService.getToken();
      if (cached && token) {
        authService.setUser(
          {
            ...cached,
            full_name: updated.user.fullName,
            name: updated.user.fullName,
            phone: updated.user.phone,
            avatar_url: updated.user.avatarUrl,
          },
          token
        );
      }
      setToast({ type: "success", text: "Profile saved" });
    } catch (err) {
      setToast({ type: "error", text: errorMessage(err, "Could not save your profile") });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => profile && hydrate(profile);

  if (loading && !profile) return <ProfileSkeleton />;

  if (loadError || !profile) {
    return (
      <div className="page-container flex min-h-[60vh] items-center justify-center py-10">
        <div className="surface-card max-w-md p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-xl font-extrabold text-ink">Couldn&apos;t load your profile</h2>
          <p className="mt-2 text-sm text-black/55">{loadError}</p>
          <button
            onClick={load}
            className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-bold text-white"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const avatarSrc = previews.avatar || profile.user.avatarUrl;
  const logoSrc = previews.logo || profile.store?.logoUrl;
  const bannerSrc = previews.banner || profile.store?.bannerUrl;

  const stats = [
    { icon: Package, label: "Products", value: profile.stats.products.toLocaleString() },
    {
      icon: Star,
      label: "Rating",
      value: profile.store?.rating ? profile.store.rating.toFixed(1) : "New",
    },
    {
      icon: TrendingUp,
      label: "Total sales",
      value: format(profile.store?.totalSales, { compact: true }),
    },
  ];

  return (
    <div className="page-container space-y-6 py-6 pb-32 sm:py-8 sm:pb-32">
      {/* hidden file inputs */}
      {(Object.keys(inputs) as ImageKey[]).map((key) => (
        <input
          key={key}
          ref={inputs[key]}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            pickImage(key, e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      ))}

      {/* header */}
      <div>
        <p className="eyebrow font-space text-emerald-700">Account</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
          <span className="line-mask">
            <span className="anim-rise">Profile</span>
          </span>
        </h1>
        <p className="mt-2 text-sm text-black/55 sm:text-base">
          How buyers see you and your store across Escro.
        </p>
      </div>

      {/* store hero */}
      <section className="surface-card overflow-hidden">
        <div className="relative h-40 bg-ink sm:h-56">
          {bannerSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerSrc} alt="Store banner" className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff14_1px,transparent_1px)] [background-size:20px_20px]">
              <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-lime/20 blur-3xl" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
          <button
            type="button"
            onClick={() => inputs.banner.current?.click()}
            className="absolute right-3 top-3 inline-flex h-10 items-center gap-2 rounded-full bg-white/90 px-4 text-xs font-bold text-ink backdrop-blur transition hover:bg-white sm:right-5 sm:top-5"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">{bannerSrc ? "Change cover" : "Add cover"}</span>
          </button>
        </div>

        <div className="relative px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <button
                type="button"
                onClick={() => inputs.logo.current?.click()}
                aria-label="Change store logo"
                className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-lime ring-4 ring-white sm:h-28 sm:w-28"
              >
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoSrc} alt="Store logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-3xl font-extrabold text-ink">
                    {initials(storeName || "Store")}
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-white opacity-0 transition group-hover:opacity-100">
                  <Camera className="h-6 w-6" />
                </span>
              </button>
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                    {storeName || "Your store"}
                  </h2>
                  {profile.store?.isVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-0.5 text-xs font-bold text-ink">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs font-semibold text-black/55">
                      Not verified yet
                    </span>
                  )}
                </div>
                <p className="mt-0.5 font-space text-xs uppercase tracking-wider text-black/45">
                  Selling since {formatDate(profile.user.memberSince)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-cream px-3 py-2.5 sm:min-w-[110px] sm:px-4">
                  <s.icon className="h-4 w-4 text-black/45" />
                  <p className="mt-1 font-space text-lg font-bold text-ink">{s.value}</p>
                  <p className="text-[11px] text-black/50">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* personal */}
          <section className="surface-card p-5 sm:p-8">
            <CardTitle icon={User} title="Personal details" subtitle="Your name and contact info." />

            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                onClick={() => inputs.avatar.current?.click()}
                aria-label="Change profile photo"
                className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-ink"
              >
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc} alt="Profile photo" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-lime">
                    {initials(fullName)}
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-white opacity-0 transition group-hover:opacity-100">
                  <Camera className="h-5 w-5" />
                </span>
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => inputs.avatar.current?.click()}
                  className="inline-flex h-10 items-center rounded-full border-2 border-ink/15 px-4 text-sm font-bold text-ink transition hover:border-ink"
                >
                  Upload photo
                </button>
                <p className="mt-1.5 text-xs text-black/45">JPG or PNG, up to 10MB</p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className={labelClass}>
                  Full name
                </label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-black/35" />
                  <input id="email" value={profile.user.email} disabled className={`${inputClass} pl-11`} />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-black/35" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${inputClass} pl-11`}
                    placeholder="+234 800 000 0000"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* store */}
          <section className="surface-card p-5 sm:p-8">
            <CardTitle icon={Store} title="Store details" subtitle="Shown on your storefront and products." />
            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="storeName" className={labelClass}>
                  Store name
                </label>
                <input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Lagos Kicks"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="storeDescription" className="text-sm font-semibold text-ink">
                    About your store
                  </label>
                  <span className="font-space text-[11px] text-black/40">{storeDescription.length}/500</span>
                </div>
                <textarea
                  id="storeDescription"
                  value={storeDescription}
                  maxLength={500}
                  rows={5}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  className="w-full resize-none rounded-2xl border-0 bg-white p-4 text-[15px] text-ink ring-1 ring-black/10 outline-none transition placeholder:text-black/35 hover:ring-black/20 focus:ring-2 focus:ring-ink"
                  placeholder="Tell buyers what you sell and why they'll love it."
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ImagePickRow
                  label="Store logo"
                  hint="Square works best"
                  hasImage={!!logoSrc}
                  onPick={() => inputs.logo.current?.click()}
                />
                <ImagePickRow
                  label="Cover image"
                  hint="Wide, at least 1600px"
                  hasImage={!!bannerSrc}
                  onPick={() => inputs.banner.current?.click()}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* account */}
          <section className="surface-ink relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-lime/15 blur-3xl" />
            <p className="eyebrow relative font-space text-lime">Account</p>
            <dl className="relative mt-5 space-y-4 text-sm">
              <Row label="Role" value={<span className="capitalize">{profile.user.role}</span>} />
              <Row
                label="Email status"
                value={
                  profile.user.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-lime">
                      <CheckCircle className="h-4 w-4" /> Verified
                    </span>
                  ) : (
                    <span className="text-amber-300">Not verified</span>
                  )
                }
              />
              <Row label="Member since" value={formatDate(profile.user.memberSince)} />
              <Row
                label="Reviews"
                value={`${profile.store?.totalReviews || 0} review${profile.store?.totalReviews === 1 ? "" : "s"}`}
              />
            </dl>
          </section>

          <PasswordCard onToast={setToast} />
        </div>
      </div>

      {/* sticky save bar */}
      <div
        className={`fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-40 p-3 lg:bottom-0 transition-all duration-300 sm:p-5 lg:left-[var(--sidebar-width,0px)] ${
          dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-full bg-ink py-2 pl-5 pr-2 text-white shadow-2xl shadow-black/30">
          <p className="truncate text-sm font-semibold">
            <span className="hidden sm:inline">You have </span>unsaved changes
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={discard}
              disabled={saving}
              className="h-10 rounded-full px-4 text-sm font-semibold text-white/70 transition hover:text-white disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-10 items-center rounded-full bg-lime px-5 text-sm font-bold text-ink transition hover:brightness-95 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 px-3" role="status">
          <div
            className={`anim-focus flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-xl ${
              toast.type === "success" ? "bg-ink text-white" : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-lime" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {toast.text}
          </div>
        </div>
      )}
    </div>
  );
}

function CardTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream text-ink">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-lg font-extrabold tracking-tight text-ink">{title}</h3>
        <p className="text-sm text-black/50">{subtitle}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0">
      <dt className="text-white/55">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}

function ImagePickRow({
  label,
  hint,
  hasImage,
  onPick,
}: {
  label: string;
  hint: string;
  hasImage: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex items-center gap-3 rounded-2xl bg-cream p-3 text-left transition hover:bg-cream-dark"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-ink">
        <Camera className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-ink">
          {hasImage ? `Change ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
        </span>
        <span className="block truncate text-xs text-black/50">{hint}</span>
      </span>
    </button>
  );
}

function PasswordCard({
  onToast,
}: {
  onToast: (t: { type: "success" | "error"; text: string }) => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const mismatch = confirm.length > 0 && next !== confirm;
  const tooShort = next.length > 0 && next.length < 8;
  const canSubmit = current && next && confirm && !mismatch && !tooShort && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setBusy(true);
      await authService.updatePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      onToast({ type: "success", text: "Password updated" });
    } catch (err) {
      onToast({ type: "error", text: errorMessage(err, "Could not update password") });
    } finally {
      setBusy(false);
    }
  };

  const field = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
    autoComplete: string
  ) => (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-black/35" />
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => set(e.target.value)}
          className={`${inputClass} pl-11`}
        />
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} className="surface-card p-5 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <CardTitle icon={Lock} title="Password" subtitle="Use at least 8 characters." />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide passwords" : "Show passwords"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-black/50 transition hover:bg-cream hover:text-ink"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      <div className="mt-6 space-y-4">
        {field("currentPassword", "Current password", current, setCurrent, "current-password")}
        {field("newPassword", "New password", next, setNext, "new-password")}
        {field("confirmPassword", "Confirm new password", confirm, setConfirm, "new-password")}
        {(mismatch || tooShort) && (
          <p className="text-xs font-medium text-red-600">
            {tooShort ? "New password must be at least 8 characters." : "Passwords don't match."}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-ink text-sm font-bold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
      >
        {busy ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

function ProfileSkeleton() {
  return (
    <div className="page-container space-y-6 py-6 sm:py-8" aria-busy="true">
      <div className="space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-black/10" />
        <div className="h-9 w-40 animate-pulse rounded-lg bg-black/10" />
      </div>
      <div className="surface-card overflow-hidden">
        <div className="h-40 animate-pulse bg-black/10 sm:h-56" />
        <div className="h-28" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="h-96 animate-pulse rounded-3xl bg-white ring-1 ring-black/5" />
        <div className="h-96 animate-pulse rounded-3xl bg-white ring-1 ring-black/5" />
      </div>
    </div>
  );
}
