// app/unauthorized/page.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShieldAlert } from '@/components/icons';
import { authService } from '../../services/auth';
import { Logo } from '../components/landing/Logo';


export default function UnauthorizedPage() {
  const router = useRouter();
  const user = authService.getUser();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    // Redirect based on user role
    const dashboardMap: Record<string, string> = {
      admin: '/admin',
      seller: '/mystore',
      agency: '/agency',
      courier: '/courier',
    };

    const redirectPath = user?.role ? dashboardMap[user.role] || '/' : '/';
    router.push(redirectPath);
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-app px-4 py-5 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#0C110E14_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />

      <div className="relative z-10 mx-auto w-full max-w-lg">
        <Link
          href="/"
          className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
          aria-label="Escro home"
        >
          <Logo />
        </Link>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_30px_60px_-40px_rgba(12,17,14,0.35)] ring-1 ring-black/5">
          {/* Ink header band */}
          <div className="relative overflow-hidden bg-ink px-6 pb-8 pt-7 text-white sm:px-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-500/25 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow font-space text-lime">Error 403</p>
                <p className="mt-2 font-space text-6xl font-bold leading-none tracking-tight sm:text-7xl">
                  403
                </p>
              </div>
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-300 ring-1 ring-red-400/20">
                <ShieldAlert className="h-7 w-7" />
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
              Access denied
            </h1>
            <p className="mt-2 text-sm text-black/55 sm:text-base">
              You don&apos;t have permission to access this page.
            </p>
            {user && (
              <p className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-full bg-cream py-1.5 pl-4 pr-1.5 text-sm text-black/60">
                Your current role
                <span className="rounded-full bg-ink px-3 py-1 font-space text-xs font-bold uppercase tracking-wider text-lime">
                  {user.role}
                </span>
              </p>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                onClick={handleGoBack}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-ink/15 px-5 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
              >
                <ArrowLeft className="h-4 w-4" />
                Go back
              </button>
              <button
                onClick={handleGoHome}
                className="group inline-flex h-12 items-center justify-center gap-3 rounded-full bg-ink pl-6 pr-2 text-sm font-bold text-white transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                <span className="flex-1 text-center">Go to dashboard</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </div>

            <p className="mt-8 border-t border-black/5 pt-6 text-sm text-black/50">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
