"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  IconBuildingBank,
  IconCash,
  IconReceipt,
  IconPercentage,
} from "@/components/icons";
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

/** Shape stored in stores.payment_settings (jsonb). */
export type PaymentSettingsData = {
  payoutMethod: "bank_transfer" | "escro_wallet";
  bankName: string;
  accountName: string;
  accountNumber: string; // 10-digit NUBAN
  payoutSchedule: "daily" | "weekly" | "biweekly" | "monthly";
  minimumPayout: number;
  acceptedMethods: string[];
  taxMode: "none" | "fixed";
  taxRate: number; // percent
  pricesIncludeTax: boolean;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  invoiceNote: string;
  autoInvoice: boolean;
};

// Numeric fields are kept as strings while editing so inputs can be cleared.
type Form = Omit<PaymentSettingsData, "minimumPayout" | "taxRate" | "nextInvoiceNumber"> & {
  minimumPayout: string;
  taxRate: string;
  nextInvoiceNumber: string;
};

const NIGERIAN_BANKS = [
  "Access Bank",
  "Citibank Nigeria",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Globus Bank",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Jaiz Bank",
  "Keystone Bank",
  "Kuda Bank",
  "Moniepoint MFB",
  "OPay",
  "PalmPay",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "SunTrust Bank",
  "Titan Trust Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
];

const PAYMENT_METHODS = [
  { id: "card", name: "Debit / Credit Card" },
  { id: "bank_transfer", name: "Bank Transfer" },
  { id: "ussd", name: "USSD" },
  { id: "escro_wallet", name: "Escro Wallet" },
  { id: "pay_on_delivery", name: "Pay on Delivery" },
];

const DEFAULTS: PaymentSettingsData = {
  payoutMethod: "bank_transfer",
  bankName: "",
  accountName: "",
  accountNumber: "",
  payoutSchedule: "weekly",
  minimumPayout: 0,
  acceptedMethods: ["card", "bank_transfer"],
  taxMode: "none",
  taxRate: 7.5, // Nigerian VAT
  pricesIncludeTax: true,
  invoicePrefix: "INV-",
  nextInvoiceNumber: 1,
  invoiceNote: "",
  autoInvoice: true,
};

const inputClass =
  "h-12 rounded-2xl border-black/10 bg-white shadow-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-lime-dark/60";
const selectClass =
  "h-12! w-full rounded-2xl border-black/10 bg-white shadow-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-lime-dark/60";
const checkboxClass =
  "mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-ink focus-visible:ring-2 focus-visible:ring-lime-dark/60";

const pick = <T,>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback: number) => {
  const n = Number(v);
  return v !== null && v !== "" && Number.isFinite(n) ? n : fallback;
};
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);

const toForm = (raw: Record<string, unknown> | null | undefined): Form => {
  const s = raw || {};
  const methods = Array.isArray(s.acceptedMethods)
    ? (s.acceptedMethods as unknown[]).filter((m): m is string => typeof m === "string")
    : DEFAULTS.acceptedMethods;
  return {
    payoutMethod: pick(s.payoutMethod, ["bank_transfer", "escro_wallet"] as const, DEFAULTS.payoutMethod),
    bankName: str(s.bankName),
    accountName: str(s.accountName),
    accountNumber: str(s.accountNumber),
    payoutSchedule: pick(s.payoutSchedule, ["daily", "weekly", "biweekly", "monthly"] as const, DEFAULTS.payoutSchedule),
    minimumPayout: String(num(s.minimumPayout, DEFAULTS.minimumPayout)),
    acceptedMethods: methods,
    taxMode: pick(s.taxMode, ["none", "fixed"] as const, DEFAULTS.taxMode),
    taxRate: String(num(s.taxRate, DEFAULTS.taxRate)),
    pricesIncludeTax: bool(s.pricesIncludeTax, DEFAULTS.pricesIncludeTax),
    invoicePrefix: str(s.invoicePrefix, DEFAULTS.invoicePrefix),
    nextInvoiceNumber: String(num(s.nextInvoiceNumber, DEFAULTS.nextInvoiceNumber)),
    invoiceNote: str(s.invoiceNote),
    autoInvoice: bool(s.autoInvoice, DEFAULTS.autoInvoice),
  };
};

const errorMessage = (err: unknown, fallback: string) =>
  (typeof err === "object" && err && "message" in err && String((err as { message: unknown }).message)) ||
  fallback;

const PaymentSettings = () => {
  const [available, setAvailable] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saved, setSaved] = useState<Form | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { symbol } = useMoney();

  const hydrate = (raw: Record<string, unknown> | null | undefined) => {
    const next = toForm(raw);
    setSaved(next);
    setForm(next);
  };

  useEffect(() => {
    let cancelled = false;
    sellerService
      .getSettings()
      .then((s: { available: boolean; payment: Record<string, unknown> }) => {
        if (cancelled) return;
        setAvailable(s.available !== false);
        hydrate(s.payment);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        hydrate(null);
        setLoadFailed(true);
        setNotice({ type: "error", text: errorMessage(err, "Failed to load payment settings") });
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

  const toggleMethod = (id: string) =>
    setForm((f) =>
      f
        ? {
            ...f,
            acceptedMethods: f.acceptedMethods.includes(id)
              ? f.acceptedMethods.filter((m) => m !== id)
              : [...f.acceptedMethods, id],
          }
        : f
    );

  const validate = (f: Form): string | null => {
    if (f.payoutMethod === "bank_transfer") {
      if (f.accountNumber && !/^\d{10}$/.test(f.accountNumber))
        return "Account number must be exactly 10 digits";
      if ((f.accountNumber || f.accountName) && !f.bankName) return "Select your bank";
    }
    const min = Number(f.minimumPayout || 0);
    if (!Number.isFinite(min) || min < 0) return "Minimum payout can't be negative";
    if (f.taxMode === "fixed") {
      const rate = Number(f.taxRate);
      if (f.taxRate === "" || !Number.isFinite(rate) || rate < 0 || rate > 100)
        return "Tax rate must be between 0 and 100";
    }
    const next = Number(f.nextInvoiceNumber);
    if (!Number.isInteger(next) || next < 1) return "Next invoice number must be a whole number of 1 or more";
    if (f.acceptedMethods.length === 0) return "Accept at least one payment method";
    return null;
  };

  const save = async () => {
    if (!form) return;
    const problem = validate(form);
    if (problem) {
      setNotice({ type: "error", text: problem });
      return;
    }
    const payload: PaymentSettingsData = {
      ...form,
      bankName: form.bankName.trim(),
      accountName: form.accountName.trim(),
      accountNumber: form.accountNumber.trim(),
      minimumPayout: Number(form.minimumPayout || 0),
      taxRate: Number(form.taxRate || 0),
      nextInvoiceNumber: Number(form.nextInvoiceNumber),
      invoicePrefix: form.invoicePrefix.trim(),
      invoiceNote: form.invoiceNote.trim(),
    };
    try {
      setSaving(true);
      setNotice(null);
      const result = await sellerService.updatePaymentSettings(payload);
      hydrate(result || payload);
      setNotice({ type: "success", text: "Payment settings saved" });
    } catch (err) {
      setNotice({ type: "error", text: errorMessage(err, "Could not save payment settings") });
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
  const isBank = form.payoutMethod === "bank_transfer";

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
        {/* Payout Account */}
        <div className="surface-card p-5 sm:p-6">
          <h3 className="mb-6 flex items-center gap-3 text-lg font-extrabold tracking-[-0.02em] text-ink sm:text-xl">
            <IconBuildingBank className="h-10 w-10 shrink-0 rounded-xl bg-cream p-2.5 text-ink" />
            Payout Account
          </h3>

          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-ink">Payout Method</Label>
                <Select
                  value={form.payoutMethod}
                  onValueChange={(v) => set("payoutMethod", v as Form["payoutMethod"])}
                  disabled={locked}
                >
                  <SelectTrigger className={selectClass}>
                    <SelectValue placeholder="Select payout method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank account</SelectItem>
                    <SelectItem value="escro_wallet">Keep in Escro wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-ink">Payout Schedule</Label>
                <Select
                  value={form.payoutSchedule}
                  onValueChange={(v) => set("payoutSchedule", v as Form["payoutSchedule"])}
                  disabled={locked}
                >
                  <SelectTrigger className={selectClass}>
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Every two weeks</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isBank && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-ink">Bank</Label>
                  <Select
                    value={form.bankName || undefined}
                    onValueChange={(v) => set("bankName", v)}
                    disabled={locked}
                  >
                    <SelectTrigger className={selectClass}>
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {(NIGERIAN_BANKS.includes(form.bankName) || !form.bankName
                        ? NIGERIAN_BANKS
                        : [form.bankName, ...NIGERIAN_BANKS]
                      ).map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-number" className="text-sm font-bold text-ink">
                    Account Number
                  </Label>
                  <Input
                    id="account-number"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit account number"
                    value={form.accountNumber}
                    onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-name" className="text-sm font-bold text-ink">
                    Account Name
                  </Label>
                  <Input
                    id="account-name"
                    placeholder="Name on the account"
                    value={form.accountName}
                    onChange={(e) => set("accountName", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minimum-payout" className="text-sm font-bold text-ink">
                  Minimum Payout Amount
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black/55">{symbol}</span>
                  <Input
                    id="minimum-payout"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={form.minimumPayout}
                    onChange={(e) => set("minimumPayout", e.target.value)}
                    className={`${inputClass} pl-8`}
                  />
                </div>
                <p className="text-xs text-black/55">
                  Balances below this amount roll over to the next payout.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Accepted Payment Methods */}
        <div className="surface-card p-5 sm:p-6">
          <h3 className="mb-6 flex items-center gap-3 text-lg font-extrabold tracking-[-0.02em] text-ink sm:text-xl">
            <IconCash className="h-10 w-10 shrink-0 rounded-xl bg-cream p-2.5 text-ink" />
            Accepted Payment Methods
          </h3>

          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-3">
            {PAYMENT_METHODS.map((method) => {
              const checked = form.acceptedMethods.includes(method.id);
              return (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3.5 transition-colors hover:border-ink ${
                    checked ? "border-ink bg-lime/15" : "border-black/10 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMethod(method.id)}
                    className={checkboxClass}
                  />
                  <span className="text-sm font-medium text-black/70">{method.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Tax Configuration */}
        <div className="surface-card p-5 sm:p-6">
          <h3 className="mb-6 flex items-center gap-3 text-lg font-extrabold tracking-[-0.02em] text-ink sm:text-xl">
            <IconPercentage className="h-10 w-10 shrink-0 rounded-xl bg-cream p-2.5 text-ink" />
            Tax Configuration
          </h3>

          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-ink">Tax Calculation Method</Label>
                <Select
                  value={form.taxMode}
                  onValueChange={(v) => set("taxMode", v as Form["taxMode"])}
                  disabled={locked}
                >
                  <SelectTrigger className={selectClass}>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Tax</SelectItem>
                    <SelectItem value="fixed">Fixed Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-rate" className="text-sm font-bold text-ink">
                  Tax Rate (%)
                </Label>
                <Input
                  id="tax-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.taxRate}
                  disabled={locked || form.taxMode === "none"}
                  onChange={(e) => set("taxRate", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-cream p-4">
              <input
                type="checkbox"
                id="prices-include-tax"
                checked={form.pricesIncludeTax}
                onChange={(e) => set("pricesIncludeTax", e.target.checked)}
                className={checkboxClass}
              />
              <label htmlFor="prices-include-tax" className="text-sm text-black/70">
                <span className="font-medium">Prices include tax</span>
                <span className="mt-0.5 block text-black/55">Product prices already include tax</span>
              </label>
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="surface-card p-5 sm:p-6">
          <h3 className="mb-6 flex items-center gap-3 text-lg font-extrabold tracking-[-0.02em] text-ink sm:text-xl">
            <IconReceipt className="h-10 w-10 shrink-0 rounded-xl bg-cream p-2.5 text-ink" />
            Invoice Settings
          </h3>

          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoice-prefix" className="text-sm font-bold text-ink">
                  Invoice Prefix
                </Label>
                <Input
                  id="invoice-prefix"
                  maxLength={12}
                  value={form.invoicePrefix}
                  onChange={(e) => set("invoicePrefix", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next-invoice" className="text-sm font-bold text-ink">
                  Next Invoice Number
                </Label>
                <Input
                  id="next-invoice"
                  type="number"
                  min="1"
                  step="1"
                  value={form.nextInvoiceNumber}
                  onChange={(e) => set("nextInvoiceNumber", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice-notes" className="text-sm font-bold text-ink">
                Default Invoice Notes
              </Label>
              <Input
                id="invoice-notes"
                placeholder="Add notes to appear on all invoices"
                maxLength={300}
                value={form.invoiceNote}
                onChange={(e) => set("invoiceNote", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-cream p-4">
              <input
                type="checkbox"
                id="auto-invoice"
                checked={form.autoInvoice}
                onChange={(e) => set("autoInvoice", e.target.checked)}
                className={checkboxClass}
              />
              <label htmlFor="auto-invoice" className="text-sm text-black/70">
                <span className="font-medium">Auto-generate invoices</span>
                <span className="mt-0.5 block text-black/55">
                  Automatically create invoices for completed orders
                </span>
              </label>
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

export default PaymentSettings;
