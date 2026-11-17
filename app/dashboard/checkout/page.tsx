"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  IconAlertTriangle,
  IconMapPin,
  IconPlus,
  IconRefresh,
  IconShieldCheck,
  IconShoppingBag,
  IconTrash,
  Loader2,
  Lock,
  Store,
  TestTube2,
} from "@/components/icons";
import { useCart, type CartItem } from "../_components/cart-context";
import { buyerService } from "@/services/shop";
import { formatMoney } from "@/lib/money";

// ---------------------------------------------------------------- types

type Address = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  country: string;
  isDefault: boolean;
};

type SummaryStore = {
  store: CartItem["product"]["store"];
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
};

type Summary = {
  stores: SummaryStore[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  unavailable: string[];
};

type CreatedOrder = {
  id: string;
  orderNumber: string;
  total: number;
  store?: { id: string; name: string } | null;
  items?: { id: string }[];
};

type AddressForm = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

const EMPTY_FORM: AddressForm = {
  fullName: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "Nigeria",
};

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

const MIGRATION_RE = /003_customer_flow\.sql/;
const UNAVAILABLE_RE = /no longer available|out of stock|empty/i;

const errMessage = (e: unknown, fallback: string) =>
  (e as { message?: string })?.message || fallback;

function validate(form: AddressForm) {
  const errors: Partial<Record<keyof AddressForm, string>> = {};
  if (form.fullName.trim().length < 2) errors.fullName = "Enter the recipient's full name";
  const digits = form.phone.replace(/[^\d]/g, "");
  if (!form.phone.trim()) errors.phone = "Phone number is required";
  else if (!/^\+?[\d\s()-]+$/.test(form.phone.trim()) || digits.length < 7 || digits.length > 15)
    errors.phone = "Enter a valid phone number";
  if (form.address.trim().length < 5) errors.address = "Enter a street address";
  if (!form.city.trim()) errors.city = "City is required";
  if (!form.state.trim()) errors.state = "State is required";
  if (!form.country.trim()) errors.country = "Country is required";
  return errors;
}

// ---------------------------------------------------------------- page

export default function CheckoutPage() {
  const router = useRouter();
  const { items: cartItems, loading: cartLoading, refresh } = useCart();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selected, setSelected] = useState<string>("new");
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [touched, setTouched] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [notes, setNotes] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [result, setResult] = useState<{ orders: CreatedOrder[]; testMode?: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [s, a] = await Promise.all([
        buyerService.getCheckoutSummary() as Promise<Summary>,
        buyerService.getAddresses() as Promise<{ addresses: Address[] }>,
      ]);
      setSummary(s);
      const list = a?.addresses || [];
      setAddresses(list);
      setSelected((prev) => {
        if (prev !== "new" && list.some((x) => x.id === prev)) return prev;
        return (list.find((x) => x.isDefault) || list[0])?.id || "new";
      });
    } catch (e) {
      setLoadError(errMessage(e, "We couldn't prepare your checkout."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  // Nothing to check out → back to the cart (but not after a successful order).
  useEffect(() => {
    if (result || cartLoading) return;
    if (cartItems.length === 0) router.replace("/dashboard/cart");
  }, [cartItems.length, cartLoading, result, router]);

  const errors = validate(form);
  const formValid = Object.keys(errors).length === 0;
  const usingNew = selected === "new";
  const unavailable = summary?.unavailable?.length ? summary.unavailable : null;
  const canPlace =
    !!summary && summary.stores.length > 0 && !unavailable && (!usingNew || formValid) && !placing;

  const setField = (key: keyof AddressForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const removeAddress = async (id: string) => {
    if (!window.confirm("Delete this saved address?")) return;
    setDeletingId(id);
    try {
      await buyerService.deleteAddress(id);
      const next = addresses.filter((a) => a.id !== id);
      setAddresses(next);
      if (selected === id) setSelected((next.find((a) => a.isDefault) || next[0])?.id || "new");
    } catch (e) {
      setPlaceError(errMessage(e, "Couldn't delete that address."));
    } finally {
      setDeletingId(null);
    }
  };

  const placeOrder = async () => {
    setTouched(true);
    setPlaceError(null);
    if (usingNew && !formValid) {
      document.getElementById("delivery")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!canPlace) return;
    setPlacing(true);
    try {
      const address = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zip.trim() || undefined,
        country: form.country.trim() || "Nigeria",
      };
      const payload = usingNew
        ? { address, saveAddress, notes: notes.trim() || undefined }
        : { addressId: selected, notes: notes.trim() || undefined };
      const res = (await buyerService.checkout(payload)) as {
        orders: CreatedOrder[];
        testMode?: boolean;
      };
      setResult({ orders: res?.orders || [], testMode: res?.testMode });
      window.scrollTo({ top: 0, behavior: "smooth" });
      await refresh();
    } catch (e) {
      setPlaceError(errMessage(e, "We couldn't place your order. Please try again."));
    } finally {
      setPlacing(false);
    }
  };

  if (result) return <SuccessView orders={result.orders} testMode={result.testMode !== false} />;

  return (
    <div className="page-container py-6 md:py-8">
      <Link
        href="/dashboard/cart"
        className="mb-4 inline-flex h-10 items-center gap-2 rounded-full pr-3 text-sm font-semibold text-black/60 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to cart
      </Link>
      <div className="mb-6 md:mb-8">
        <p className="eyebrow font-space text-emerald-700">Secure checkout</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
          Checkout
        </h1>
        <p className="mt-2 text-sm text-black/55 sm:text-base">
          Confirm where it&apos;s going, review your order and pay into escrow.
        </p>
      </div>

      {loadError ? (
        <ErrorCard message={loadError} onRetry={load} />
      ) : loading || !summary ? (
        <CheckoutSkeleton />
      ) : unavailable ? (
        <div className="flex flex-col items-center rounded-3xl bg-amber-50 px-6 py-14 text-center ring-1 ring-amber-600/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <IconAlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-extrabold tracking-tight text-ink">
            Some items need your attention
          </h2>
          <p className="mt-1 max-w-md text-sm text-amber-800">
            {unavailable.length} item{unavailable.length === 1 ? " is" : "s are"} out of stock or
            no longer available in the quantity you picked. Update your cart to continue.
          </p>
          <Link
            href="/dashboard/cart"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-soft"
          >
            <ArrowLeft className="h-4 w-4" />
            Review cart
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start xl:gap-8">
          <div className="min-w-0 space-y-5">
            {/* ---------------- 1. Delivery */}
            <section id="delivery" className="surface-card scroll-mt-28 p-5 sm:p-6">
              <StepHeading n={1} title="Delivery address" />

              <div role="radiogroup" aria-label="Delivery address" className="mt-5 grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => {
                  const active = selected === a.id;
                  return (
                    <div
                      key={a.id}
                      role="radio"
                      aria-checked={active}
                      tabIndex={0}
                      onClick={() => setSelected(a.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(a.id);
                        }
                      }}
                      className={`relative cursor-pointer rounded-2xl p-4 pr-12 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
                        active ? "bg-cream ring-2 ring-ink" : "bg-white ring-1 ring-black/10 hover:ring-ink/30"
                      }`}
                    >
                      <span
                        className={`absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full ring-2 ${
                          active ? "bg-ink ring-ink" : "ring-black/20"
                        }`}
                      >
                        {active && <span className="h-2 w-2 rounded-full bg-lime" />}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-ink">{a.fullName}</p>
                        {a.isDefault && (
                          <span className="rounded-full bg-lime px-2 py-0.5 font-space text-[10px] font-bold uppercase tracking-wider text-ink">
                            Default
                          </span>
                        )}
                        {a.label && (
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-black/55 ring-1 ring-black/10">
                            {a.label}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-black/60">{a.address}</p>
                      <p className="text-sm text-black/60">
                        {[a.city, a.state, a.zip].filter(Boolean).join(", ")} · {a.country}
                      </p>
                      <p className="mt-1 font-space text-xs text-black/50">{a.phone}</p>
                      <button
                        type="button"
                        aria-label="Delete address"
                        disabled={deletingId === a.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAddress(a.id);
                        }}
                        className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        {deletingId === a.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <IconTrash className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  role="radio"
                  aria-checked={usingNew}
                  onClick={() => setSelected("new")}
                  className={`flex min-h-24 items-center justify-center gap-2 rounded-2xl p-4 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
                    usingNew
                      ? "bg-cream text-ink ring-2 ring-ink"
                      : "border-2 border-dashed border-black/15 text-black/60 hover:border-ink hover:text-ink"
                  } ${addresses.length === 0 ? "sm:col-span-2" : ""}`}
                >
                  <IconPlus className="h-4 w-4" />
                  {addresses.length ? "Add new address" : "Enter a delivery address"}
                </button>
              </div>

              {usingNew && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" error={touched ? errors.fullName : undefined} className="sm:col-span-2">
                    <input
                      value={form.fullName}
                      onChange={(e) => setField("fullName", e.target.value)}
                      autoComplete="name"
                      placeholder="e.g. Ada Okafor"
                      className={inputCls(touched && !!errors.fullName)}
                    />
                  </Field>
                  <Field label="Phone number" error={touched ? errors.phone : undefined}>
                    <input
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+234 801 234 5678"
                      className={inputCls(touched && !!errors.phone)}
                    />
                  </Field>
                  <Field label="Country" error={touched ? errors.country : undefined}>
                    <input
                      value={form.country}
                      onChange={(e) => setField("country", e.target.value)}
                      autoComplete="country-name"
                      className={inputCls(touched && !!errors.country)}
                    />
                  </Field>
                  <Field label="Street address" error={touched ? errors.address : undefined} className="sm:col-span-2">
                    <input
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                      autoComplete="street-address"
                      placeholder="House number, street, area"
                      className={inputCls(touched && !!errors.address)}
                    />
                  </Field>
                  <Field label="City" error={touched ? errors.city : undefined}>
                    <input
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      autoComplete="address-level2"
                      placeholder="e.g. Ikeja"
                      className={inputCls(touched && !!errors.city)}
                    />
                  </Field>
                  <Field label="State" error={touched ? errors.state : undefined}>
                    {form.country.trim().toLowerCase() === "nigeria" ? (
                      <select
                        value={form.state}
                        onChange={(e) => setField("state", e.target.value)}
                        autoComplete="address-level1"
                        className={`${inputCls(touched && !!errors.state)} appearance-none`}
                      >
                        <option value="">Select a state</option>
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={form.state}
                        onChange={(e) => setField("state", e.target.value)}
                        autoComplete="address-level1"
                        className={inputCls(touched && !!errors.state)}
                      />
                    )}
                  </Field>
                  <Field label="Postal code (optional)">
                    <input
                      value={form.zip}
                      onChange={(e) => setField("zip", e.target.value)}
                      autoComplete="postal-code"
                      inputMode="numeric"
                      className={inputCls(false)}
                    />
                  </Field>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 self-end text-sm font-medium text-ink">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="h-5 w-5 rounded accent-ink"
                    />
                    Save this address for next time
                  </label>
                </div>
              )}
            </section>

            {/* ---------------- 2. Review */}
            <section className="surface-card p-5 sm:p-6">
              <StepHeading n={2} title="Review your order" />
              <p className="mt-2 text-sm text-black/55">
                Each store ships separately, so you&apos;ll get one order per store.
              </p>
              <div className="mt-5 space-y-4">
                {summary.stores.map((group) => (
                  <div key={group.store.id} className="rounded-2xl bg-cream p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink text-lime">
                        {group.store.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={group.store.logo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Store className="h-4 w-4" />
                        )}
                      </span>
                      <p className="min-w-0 truncate font-bold text-ink">{group.store.name}</p>
                    </div>
                    <ul className="mt-3 divide-y divide-black/5 rounded-xl bg-white px-3">
                      {group.items.map((item) => (
                        <li key={item.id} className="flex items-center gap-3 py-3">
                          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream">
                            {item.product.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.product.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-black/30">
                                <IconShoppingBag className="h-5 w-5" />
                              </span>
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-sm font-semibold text-ink">{item.product.name}</p>
                            <p className="font-space text-[11px] text-black/50">
                              {item.quantity} × {formatMoney(item.product.price, group.store.currency)}
                            </p>
                          </div>
                          <p className="shrink-0 font-space text-sm font-bold text-ink">
                            {formatMoney(item.lineTotal, group.store.currency)}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <dl className="mt-3 space-y-1.5 px-1 text-sm">
                      <Row label="Subtotal" value={formatMoney(group.subtotal, group.store.currency)} />
                      <Row
                        label="Shipping"
                        value={group.shipping > 0 ? formatMoney(group.shipping, group.store.currency) : "Free"}
                      />
                      {group.tax > 0 && <Row label="Tax" value={formatMoney(group.tax, group.store.currency)} />}
                      <Row label="Store total" value={formatMoney(group.total, group.store.currency)} strong />
                    </dl>
                  </div>
                ))}
              </div>

              <label htmlFor="notes" className="mt-5 block text-sm font-semibold text-ink">
                Notes for the seller <span className="font-normal text-black/45">(optional)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Delivery instructions, landmarks, preferred time…"
                className="mt-2 w-full resize-y rounded-2xl bg-white px-4 py-3 text-sm text-ink ring-1 ring-black/10 placeholder:text-black/35 focus:outline-none focus:ring-2 focus:ring-lime-dark/60"
              />
            </section>

            {/* ---------------- 3. Payment */}
            <section className="surface-card p-5 sm:p-6">
              <StepHeading n={3} title="Payment" />
              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-600/15">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <TestTube2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-space text-[11px] font-bold uppercase tracking-widest text-sky-800">
                    Test mode
                  </p>
                  <p className="mt-1 text-sm text-sky-900">
                    No card will be charged. Your payment will be recorded as held in Escro escrow.
                  </p>
                </div>
              </div>

              <div className="surface-ink mt-4 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime text-ink">
                    <IconShieldCheck className="h-5 w-5" />
                  </span>
                  <p className="font-bold">How Escro escrow protects you</p>
                </div>
                <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ["01", "You pay", "Your money goes into escrow, not to the seller."],
                    ["02", "Seller ships", "The seller prepares and ships your order."],
                    ["03", "You confirm", "Payment is released only after you confirm delivery."],
                  ].map(([n, t, d]) => (
                    <li key={n} className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                      <p className="font-space text-xs text-lime">{n}</p>
                      <p className="mt-1 text-sm font-bold">{t}</p>
                      <p className="mt-0.5 text-xs text-white/60">{d}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-xs text-white/55">
                  Something wrong? Report a problem from your orders page before confirming and the
                  money stays in escrow while it&apos;s resolved.
                </p>
              </div>
            </section>
          </div>

          {/* ---------------- Summary sidebar */}
          <aside className="lg:sticky lg:top-28">
            <div className="surface-card p-5 sm:p-6">
              <p className="eyebrow font-space text-black/45">Total due</p>
              <dl className="mt-4 space-y-2.5 text-sm">
                <Row label={`Items (${summary.itemCount})`} value={formatMoney(summary.subtotal, "ngn")} />
                <Row
                  label="Shipping"
                  value={summary.shipping > 0 ? formatMoney(summary.shipping, "ngn") : "Free"}
                />
                <Row label="Tax" value={formatMoney(summary.tax, "ngn")} />
              </dl>
              <div className="mt-4 flex items-end justify-between gap-3 border-t border-black/5 pt-4">
                <p className="font-semibold text-ink">Total</p>
                <p className="font-space text-2xl font-bold tracking-tight text-ink">
                  {formatMoney(summary.total, "ngn")}
                </p>
              </div>
              {summary.stores.length > 1 && (
                <p className="mt-2 text-xs text-black/50">
                  Split into {summary.stores.length} orders, one per store.
                </p>
              )}

              {!usingNew && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl bg-cream p-3 text-xs text-black/60">
                  <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                  {(() => {
                    const a = addresses.find((x) => x.id === selected);
                    return a ? (
                      <span>
                        Delivering to <span className="font-semibold text-ink">{a.fullName}</span>,{" "}
                        {a.city}, {a.state}
                      </span>
                    ) : null;
                  })()}
                </div>
              )}

              {placeError && (
                <div
                  role="alert"
                  className={`mt-4 rounded-2xl p-3 text-sm ring-1 ${
                    MIGRATION_RE.test(placeError)
                      ? "bg-amber-50 font-space text-amber-800 ring-amber-600/20"
                      : "bg-red-50 text-red-700 ring-red-600/15"
                  }`}
                >
                  <p className="wrap-break-word">{placeError}</p>
                  {UNAVAILABLE_RE.test(placeError) && (
                    <Link href="/dashboard/cart" className="mt-2 inline-block font-semibold underline">
                      Go to cart
                    </Link>
                  )}
                </div>
              )}

              {touched && usingNew && !formValid && (
                <p className="mt-4 text-sm font-medium text-red-600">
                  Complete the delivery address to continue.
                </p>
              )}

              <button
                type="button"
                onClick={placeOrder}
                disabled={placing || (!usingNew && !canPlace)}
                className="group mt-5 flex h-12 w-full items-center justify-between rounded-full bg-ink pl-6 pr-1.5 font-semibold text-white transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placing ? "Placing order…" : "Place order"}
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-ink transition-transform group-hover:translate-x-0.5">
                  {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                </span>
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-black/50">
                <Lock className="h-3.5 w-3.5" />
                Held in escrow until you confirm delivery
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- pieces

const inputCls = (invalid: boolean) =>
  `h-12 w-full rounded-2xl bg-white px-4 text-sm text-ink ring-1 placeholder:text-black/35 focus:outline-none focus:ring-2 ${
    invalid ? "ring-red-400 focus:ring-red-400" : "ring-black/10 focus:ring-lime-dark/60"
  }`;

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

function StepHeading({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink font-space text-sm font-bold text-lime">
        {n}
      </span>
      <h2 className="text-xl font-extrabold tracking-tight text-ink">{title}</h2>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? "border-t border-black/5 pt-2" : ""}`}>
      <dt className={strong ? "font-semibold text-ink" : "text-black/55"}>{label}</dt>
      <dd className={`font-space font-bold text-ink ${strong ? "text-base" : ""}`}>{value}</dd>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  const migration = MIGRATION_RE.test(message);
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
        {migration ? "Database setup needed" : "Checkout unavailable"}
      </h2>
      <p className={`mt-1 max-w-md wrap-break-word text-sm ${migration ? "font-space text-amber-800" : "text-black/55"}`}>
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-soft"
      >
        <IconRefresh className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

function SuccessView({ orders, testMode }: { orders: CreatedOrder[]; testMode: boolean }) {
  const total = orders.reduce((n, o) => n + (Number(o.total) || 0), 0);
  return (
    <div className="page-container py-8 md:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="surface-ink overflow-hidden p-6 text-center sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-lime text-ink">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="eyebrow mt-6 font-space text-lime">Order placed</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            Thank you! Your money is safe.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/65">
            {formatMoney(total, "ngn")} is now held in Escro escrow. The seller is paid only after
            you confirm delivery.
            {testMode && " (Test mode — no card was charged.)"}
          </p>
        </div>

        <div className="surface-card mt-4 p-2">
          <p className="eyebrow px-4 pb-2 pt-3 font-space text-black/45">
            {orders.length} order{orders.length === 1 ? "" : "s"} created
          </p>
          <ul className="divide-y divide-black/5">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/dashboard/orders#order-${o.id}`}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-cream/60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-ink">
                    <IconShoppingBag className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-space text-sm font-bold text-ink">{o.orderNumber}</p>
                    <p className="truncate text-xs text-black/55">
                      {o.store?.name || "Store"}
                      {o.items?.length ? ` · ${o.items.length} item${o.items.length === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 font-space text-sm font-bold text-ink">{formatMoney(o.total, "ngn")}</p>
                  <ArrowRight className="h-4 w-4 shrink-0 text-black/40" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/orders"
            className="group flex h-12 flex-1 items-center justify-between rounded-full bg-ink pl-6 pr-1.5 font-semibold text-white hover:bg-ink-soft"
          >
            View my orders
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-ink transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          <Link
            href="/dashboard/shop"
            className="flex h-12 flex-1 items-center justify-center rounded-full border-2 border-ink/15 font-semibold text-ink hover:border-ink"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:gap-8" aria-busy="true">
      <div className="space-y-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="surface-card space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-black/5" />
              <div className="h-5 w-48 animate-pulse rounded-full bg-black/5" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-28 animate-pulse rounded-2xl bg-cream" />
              <div className="h-28 animate-pulse rounded-2xl bg-cream" />
            </div>
          </div>
        ))}
      </div>
      <div className="surface-card h-80 animate-pulse" />
    </div>
  );
}
