"use client";

import React, { useState } from "react";
import { KeyRound, MailCheck, ShieldCheck } from "@/components/icons";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import AuthShell, { Highlight } from "../components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (email: string) => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      console.log("Password reset email sent to:", email);

      // Better Auth integration here
      // await authClient.forgetPassword({ email });

      setIsLoading(false);
    }, 2000);
  };

  const steps = [
    { icon: MailCheck, label: "Request a link", desc: "Enter the email on your account" },
    { icon: KeyRound, label: "Set a new password", desc: "Follow the secure link we send you" },
    { icon: ShieldCheck, label: "You're back in", desc: "Your escrow funds stay protected" },
  ];

  return (
    <AuthShell
      hideHeader
      title="Forgot password"
      heading={
        <>
          Locked out?
          <br />
          <Highlight>We&apos;ve got you.</Highlight>
        </>
      }
      description="Reset your password in a couple of minutes. Your orders, store and escrow balances remain safe the whole time."
      aside={
        <ol className="space-y-2">
          {steps.map((step, i) => (
            <li key={step.label} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lime">
                <step.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 text-sm">
                <span className="mr-2 font-space text-[11px] text-lime">0{i + 1}</span>
                <span className="font-semibold text-white">{step.label}</span>
                <span className="block text-white/50">{step.desc}</span>
              </span>
            </li>
          ))}
        </ol>
      }
    >
      <ForgotPasswordForm onSubmit={handleSubmit} isLoading={isLoading} />
    </AuthShell>
  );
}
