"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../../services/auth";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, BadgeCheck, Zap } from "@/components/icons";
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

const ROLE_ROUTES: Record<string, string> = {
  customer: "/dashboard",
  seller: "/mystore",
  courier: "/courier/",
  agency: "/agency/",
  admin: "/admin/",
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { user } = await authService.login({ email, password });

      if (!user || !user.role) {
        throw new Error("Invalid user role returned from server");
      }

      const redirectTo = ROLE_ROUTES[user.role] ?? "/";
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const highlights = [
    { icon: ShieldCheck, label: "Escrow protection", desc: "Funds held until delivery is confirmed" },
    { icon: BadgeCheck, label: "Verified sellers", desc: "Every store is vetted and trusted" },
    { icon: Zap, label: "Fast payouts", desc: "Instant release upon confirmation" },
  ];

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back"
      subtitle="Sign in to your account to continue."
      heading={
        <>
          Trade with
          <br />
          <Highlight>confidence.</Highlight>
        </>
      }
      description="Every transaction is protected by our escrow system. Your funds stay secure until delivery is confirmed."
      aside={
        <ul className="space-y-2">
          {highlights.map((item) => (
            <li key={item.label} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lime">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 text-sm">
                <span className="font-semibold text-white">{item.label}</span>
                <span className="text-white/50"> — {item.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      }
      footer={
        <p className="text-sm text-black/55">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className={authLinkClass}>
            Create account
          </Link>
        </p>
      }
    >
      {error && <AuthError message={error} />}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="email" className={authLabelClass}>
            Email address
          </label>
          <div className="relative">
            <Mail className={authIconClass} />
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${authInputClass} pr-4`}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="password" className="block text-sm font-semibold text-ink">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="rounded text-sm font-semibold text-black/55 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className={authIconClass} />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${authInputClass} pr-12`}
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

        <AuthSubmitButton loading={isLoading} loadingText="Signing in..." className="mt-2">
          Sign in
        </AuthSubmitButton>
      </form>
    </AuthShell>
  );
}
