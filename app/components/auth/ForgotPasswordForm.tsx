import React, { useState } from "react";
import { Mail, ArrowLeft, ArrowRight, MailCheck } from "@/components/icons";
import Input from "../ui/Input";
import { Button } from "../ui/Button";

interface ForgotPasswordFormProps {
  onSubmit?: (email: string) => void;
  isLoading?: boolean;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      setError("Email is required");
      return false;
    } else if (!emailRegex.test(email)) {
      setError("Please enter a valid email");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (validateEmail()) {
      if (onSubmit) {
        onSubmit(email);
      }
      setIsSubmitted(true);
    }
  };


  const backLink = (
    <a
      href="/login"
      className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-black/55 transition-colors hover:bg-cream hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
    >
      <ArrowLeft size={16} />
      Back to login
    </a>
  );

  if (isSubmitted) {
    return (
      <div className="space-y-7">
        <div>
          <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-lime text-ink">
            <MailCheck size={26} />
          </span>
          <p className="eyebrow mb-3 font-space text-emerald-700">Link sent</p>
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-black/55 sm:text-base">
            We&apos;ve sent a password reset link to
          </p>
          <p className="mt-2 inline-block max-w-full break-all rounded-full bg-cream px-3 py-1 font-space text-sm font-bold text-ink">
            {email}
          </p>
        </div>

        <div className="rounded-2xl bg-ink p-5 text-white">
          <p className="eyebrow mb-4 font-space text-lime">Next steps</p>
          <ol className="space-y-3 text-sm text-white/75">
            {[
              "Check your inbox for an email from Escro",
              "Click the reset link in the email",
              "Create a new password",
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-space text-[11px] font-bold text-lime">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col items-start gap-3 border-t border-black/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-black/55">
            Didn&apos;t receive it?{" "}
            <button
              onClick={() => setIsSubmitted(false)}
              className="rounded font-bold text-ink underline decoration-lime-dark decoration-2 underline-offset-4 transition-colors hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
            >
              Try again
            </button>
          </p>
          <div className="-ml-4 sm:ml-0 sm:-mr-4">{backLink}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cream text-ink">
          <Mail size={24} />
        </span>
        <p className="eyebrow mb-3 font-space text-emerald-700">Password reset</p>
        <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
          Forgot password?
        </h2>
        <p className="mt-2 max-w-sm text-sm text-black/55 sm:text-base">
          No worries. Enter your email and we&apos;ll send you reset instructions.
        </p>
      </div>

      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        icon={<Mail size={20} />}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError("");
        }}
        error={error}
        required
      />

      <Button
        onClick={handleSubmit}
        size="lg"
        className="group h-12 w-full gap-3 rounded-full bg-ink pl-6 pr-2 text-[15px] font-bold text-white transition-transform hover:scale-[1.01] hover:bg-ink focus-visible:ring-lime-dark/60 active:scale-[0.98]"
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : (
          <>
            <span className="flex-1 text-center">Send reset link</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="h-4 w-4" />
            </span>
          </>
        )}
      </Button>

      <div className="-ml-4">{backLink}</div>
    </div>
  );
};

export default ForgotPasswordForm;
