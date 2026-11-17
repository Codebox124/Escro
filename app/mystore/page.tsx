'use client';

import { useState, useEffect } from 'react';
import { IconCash, Package, ShoppingCart, TrendingUp } from "@/components/icons";
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { sellerService } from '@/services/seller';
import StatCard from "./_components/stat-card";
import SalesChart from "./_components/sales-chart";
import QuickActions from "./_components/quick-actions";
import WalletCard from "./_components/wallet-card";
import { useMoney } from "./_components/currency";

const Page = () => {
  // Define the type for the user object
  type User = {
    name?: string;
    email?: string;
    // Add other user properties as needed
  };

  // Get current logged-in user
  const { user, loading: userLoading, error: userError } = useCurrentUser() as {
    user: User | null;
    loading: boolean;
    error: string | null;
  };

  // Define the type for dashboard stats
  type DashboardStats = {
    todaySales: number;
    todaySalesChange: number;
    totalProducts: number;
    productsChange: number;
    pendingOrders: number;
    ordersChange: number;
    totalRevenue: number;
    revenueChange: number;
    totalOrders?: number;
    salesChartData?: {
      labels?: string[];
      datasets?: Array<{ label: string; data: number[] }>;
    };
  };

  // Dashboard data state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { format } = useMoney();

  // Fetch dashboard data when user is loaded
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real data from API
      const stats = await sellerService.getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message?: string }).message)
          : 'Failed to load dashboard data'
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (userLoading || loading) {
    return (
      <div className="page-container space-y-6 py-6 sm:py-8" aria-busy="true">
        <span className="sr-only">Loading your dashboard...</span>
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded-full bg-black/10" />
          <div className="h-10 w-56 animate-pulse rounded-xl bg-black/10" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded-lg bg-black/[0.07]" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="surface-card space-y-4 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 animate-pulse rounded bg-black/10" />
                <div className="h-11 w-11 animate-pulse rounded-xl bg-cream" />
              </div>
              <div className="h-8 w-28 animate-pulse rounded-lg bg-black/10" />
              <div className="h-6 w-32 animate-pulse rounded-full bg-cream" />
            </div>
          ))}
        </div>
        <div className="surface-card p-5 sm:p-6">
          <div className="mb-5 h-5 w-40 animate-pulse rounded bg-black/10" />
          <div className="h-60 animate-pulse rounded-2xl bg-cream sm:h-72 lg:h-80" />
        </div>
      </div>
    );
  }

  // Error state
  if (userError || error) {
    return (
      <div className="page-container flex min-h-[70vh] items-center justify-center py-10">
        <div className="surface-card w-full max-w-md p-6 text-center sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mb-1 text-2xl font-extrabold tracking-[-0.03em] text-ink">Something went wrong</h2>
          <p className="mb-6 text-sm text-black/55">{userError || error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Stats from the API; missing values render as zero
  const stats = [
    {
      title: "Today's Sales",
      value: format(dashboardStats?.todaySales),
      icon: IconCash,
      change: {
        value: dashboardStats?.todaySalesChange || 0,
        isPositive: (dashboardStats?.todaySalesChange || 0) >= 0
      },
    },
    {
      title: "Total Products",
      value: dashboardStats?.totalProducts?.toString() || "0",
      icon: Package,
      change: {
        value: dashboardStats?.productsChange || 0,
        isPositive: (dashboardStats?.productsChange || 0) >= 0
      },
    },
    {
      title: "Pending Orders",
      value: dashboardStats?.pendingOrders?.toString() || "0",
      icon: ShoppingCart,
      change: {
        value: dashboardStats?.ordersChange || 0,
        isPositive: (dashboardStats?.ordersChange || 0) >= 0
      },
    },
    {
      title: "Total Revenue",
      value: format(dashboardStats?.totalRevenue),
      icon: TrendingUp,
      change: {
        value: dashboardStats?.revenueChange || 0,
        isPositive: (dashboardStats?.revenueChange || 0) >= 0
      },
      variant: "ink" as const,
    },
  ];

  // Show the key revenue stat first as the highlight card
  const orderedStats = [stats[3], ...stats.slice(0, 3)];

  return (
    <div className="page-container space-y-6 py-6 sm:py-8">
      {/* Page Header with User Info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow font-space text-emerald-700">Seller Center</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-black/55 sm:text-base">
            Welcome back, <span className="font-bold text-ink">{user?.name || 'Seller'}</span>! Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchDashboardData}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full border-2 border-ink/15 bg-transparent px-5 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 sm:self-auto"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
        {orderedStats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            variant={stat.variant}
          />
        ))}
      </div>

      {/* Earnings wallet */}
      <WalletCard />

      {/* Sales Chart - Pass real data if available */}
      <SalesChart data={dashboardStats?.salesChartData} />

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
};

export default Page;