"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../../services/auth";
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ShoppingBag,
  Store,
  Truck,
  Building2,
  Check,
} from "@/components/icons";
import Link from "next/link";
import AuthShell, {
  AuthError,
  AuthSubmitButton,
  Highlight,
  authIconClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
} from "../components/auth/AuthShell";

const roles = [
  { value: "customer", label: "Customer", desc: "Shop & Buy", icon: ShoppingBag, color: "emerald" },
  { value: "seller", label: "Store Owner", desc: "Sell Products", icon: Store, color: "amber" },
  { value: "courier", label: "Courier", desc: "Deliver Orders", icon: Truck, color: "blue" },
  { value: "agency", label: "Agency", desc: "Manage Logistics", icon: Building2, color: "violet" },
];

const roleRoutes: Record<string, string> = {
  customer: "/dashboard",
  seller: "/mystore",
  courier: "/courier",
  agency: "/agency",
};

const inputClass = authInputClass;
const labelClass = authLabelClass;
const iconClass = authIconClass;

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "customer",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e: { target: { name: any; value: any } }) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.register(formData);
      router.push(roleRoutes[formData.role] || "/");
    } catch (err) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find((r) => r.value === formData.role);

  return (
    <AuthShell
      wide
      eyebrow="Create account"
      title="Join Escro"
      subtitle={
        <>
          Set up your account in under a minute
          {selectedRole && (
            <>
              {" "}as {/^[AEIOU]/.test(selectedRole.label) ? "an" : "a"}{" "}
              <span className="font-semibold text-ink">{selectedRole.label}</span>
            </>
          )}
          .
        </>
      }
      heading={
        <>
          Start your
          <br />
          <Highlight>journey.</Highlight>
        </>
      }
      description="Join thousands of users on the most secure multi-vendor marketplace. Buy, sell, deliver, or partner with confidence."
      aside={
        <ul className="grid grid-cols-2 gap-2">
          {roles.map((role) => {
            const active = formData.role === role.value;
            return (
              <li
                key={role.value}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors duration-300 ${
                  active ? "bg-lime text-ink" : "bg-white/[0.05] text-white/60"
                }`}
              >
                <role.icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{role.label}</span>
                  <span className={`block truncate text-xs ${active ? "text-ink/60" : "text-white/40"}`}>
                    {role.desc}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      }
      footer={
        <p className="text-sm text-black/55">
          Already have an account?{" "}
          <Link href="/login" className={authLinkClass}>
            Sign in
          </Link>
        </p>
      }
    >
      {error && <AuthError message={error} />}

      <form onSubmit={handleRegister} className="space-y-5">
        {/* Role Selection */}
        <fieldset>
          <legend className={labelClass}>I want to join as</legend>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {roles.map((role) => {
              const active = formData.role === role.value;
              return (
                <button
                  key={role.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFormData({ ...formData, role: role.value })}
                  className={`relative flex min-h-[88px] flex-col items-start justify-between gap-2 rounded-2xl p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark focus-visible:ring-offset-2 ${
                    active
                      ? "bg-ink text-white shadow-lg shadow-black/15"
                      : "bg-cream/70 text-ink ring-1 ring-black/5 hover:bg-cream hover:ring-black/15"
                  }`}
                >
                  {active && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-lime text-ink">
                      <Check className="h-3 w-3" strokeWidth={3.5} />
                    </span>
                  )}
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      active ? "bg-white/10 text-lime" : "bg-white text-ink"
                    }`}
                  >
                    <role.icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-xs font-bold leading-tight">{role.label}</span>
                    <span className={`block text-[11px] ${active ? "text-white/50" : "text-black/45"}`}>
                      {role.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Full Name */}
        <div>
          <label htmlFor="full_name" className={labelClass}>
            Full name
          </label>
          <div className="relative">
            <User className={iconClass} />
            <input
              type="text"
              name="full_name"
              id="full_name"
              placeholder="Enter your full name"
              autoComplete="name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className={`${inputClass} pr-4`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className={labelClass}>
              Email address
            </label>
            <div className="relative">
              <Mail className={iconClass} />
              <input
                type="email"
                name="email"
                id="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`${inputClass} pr-4`}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone <span className="font-normal text-black/40">(optional)</span>
            </label>
            <div className="relative">
              <Phone className={iconClass} />
              <input
                type="tel"
                name="phone"
                id="phone"
                placeholder="+1 (555) 000-0000"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`${inputClass} pr-4`}
              />
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <div className="relative">
            <Lock className={iconClass} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              placeholder="Create a strong password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              required
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-cream hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <AuthSubmitButton loading={loading} loadingText="Creating account..." className="mt-2">
          Create account
        </AuthSubmitButton>

        <p className="text-center font-space text-[11px] uppercase tracking-widest text-black/40">
          Encrypted end to end
        </p>
      </form>
    </AuthShell>
  );
}
