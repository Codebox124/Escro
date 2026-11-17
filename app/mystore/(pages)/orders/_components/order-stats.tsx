"use client";

import {
  IconChecks,
  IconClock,
  IconPackage,
  IconX,
} from "@/components/icons";

interface OrderStats {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
}

interface OrderStatsProps {
  stats: OrderStats;
}

const OrderStatsBar = ({ stats }: OrderStatsProps) => {
  const statItems = [
    {
      label: "Total Orders",
      value: stats.total,
      icon: IconPackage,
      tone: "bg-white/10 text-lime ring-white/10",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: IconClock,
      tone: "bg-amber-100 text-amber-700 ring-amber-600/10",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: IconChecks,
      tone: "bg-emerald-100 text-emerald-700 ring-emerald-600/10",
    },
    {
      label: "Cancelled",
      value: stats.cancelled,
      icon: IconX,
      tone: "bg-red-100 text-red-700 ring-red-600/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {statItems.map((item, i) => (
        <div
          key={item.label}
          className={`flex items-center gap-3 p-4 sm:gap-4 sm:p-5 ${i === 0 ? "surface-ink" : "surface-card"}`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset sm:h-11 sm:w-11 ${item.tone}`}
          >
            <item.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className={`truncate text-xs font-semibold sm:text-sm ${i === 0 ? "text-white/60" : "text-black/50"}`}>
              {item.label}
            </p>
            <p className={`mt-0.5 font-space text-xl font-bold sm:text-2xl ${i === 0 ? "text-lime" : "text-ink"}`}>
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderStatsBar;
