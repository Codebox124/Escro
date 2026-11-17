'use client';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import Categories from "./_components/cartegories";
import FeaturedGoods from "./_components/featured-goods";

type DashboardUser = { id?: string; full_name?: string; role?: string };

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const Page = () => {
  const { user, loading } = useCurrentUser() as { user: DashboardUser | null; loading: boolean };

  // Show loading state while fetching user
  if (loading) {
    return (
      <div className="page-container py-6 md:py-8">
        <div className="animate-pulse">
          <div className="h-40 rounded-[28px] bg-ink/10 sm:h-44" />
          <div className="mt-8 flex gap-3 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-11 w-28 shrink-0 rounded-full bg-black/5 sm:w-32" />
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
                <div className="aspect-square bg-cream" />
                <div className="space-y-2 p-3 sm:p-4">
                  <div className="h-3.5 w-3/4 rounded bg-black/5" />
                  <div className="h-3 w-1/2 rounded bg-black/5" />
                  <div className="h-5 w-1/3 rounded bg-black/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-6 md:py-8">
      {/* Welcome Section */}
      <section className="relative overflow-hidden rounded-[28px] bg-ink px-5 py-7 text-white shadow-[0_40px_80px_-40px_rgba(12,17,14,0.6)] sm:px-8 sm:py-9 md:px-10 md:py-10">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-lime/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-space text-[10px] uppercase tracking-widest text-lime">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              Escrow-protected marketplace
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl md:text-5xl">
              {greetingFor(new Date())},{' '}
              <span className="text-lime">{user?.full_name || 'Guest'}</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/60 sm:text-base">
              Shop from verified sellers. Your money stays in escrow until you confirm delivery.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-white/[0.06] p-3 pr-4 ring-1 ring-white/10">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime text-ink">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M7 10V8a5 5 0 0 1 10 0v2" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                <rect x="4" y="10" width="16" height="11" rx="3" fill="currentColor" />
              </svg>
            </span>
            <div>
              <p className="font-space text-[10px] uppercase tracking-widest text-white/45">Every order</p>
              <p className="text-sm font-bold">Funds held until you confirm</p>
            </div>
          </div>
        </div>
      </section>

      <Categories />

      {/* Newest products */}
      <FeaturedGoods />
    </div>
  );
};

export default Page;
