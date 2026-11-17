import { LucideIcon } from "@/components/icons";
import { IconTrendingUp, IconTrendingDown } from "@/components/icons";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    isPositive: boolean;
  };
  /** "ink" renders the highlight (dark) version of the card */
  variant?: "default" | "ink";
}

const StatCard = ({ title, value, icon: Icon, change, variant = "default" }: StatCardProps) => {
  const ink = variant === "ink";

  return (
    <div
      className={`group relative overflow-hidden p-5 sm:p-6 ${
        ink ? "surface-ink card-hover shadow-[0_20px_40px_-20px_rgb(12_17_14/0.5)]" : "surface-card card-hover"
      }`}
    >
      {/* Decorative rings */}
      {ink ? (
        <>
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-44 w-44 rounded-full border-[22px] border-lime/10" />
          <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full border-[12px] border-lime/10" />
        </>
      ) : null}

      <div className="relative">
        {/* Header: Title and Icon */}
        <div className="flex items-start justify-between gap-3">
          <p className={`pt-1 text-sm font-semibold ${ink ? "text-white/60" : "text-black/50"}`}>{title}</p>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              ink ? "bg-white/10 text-lime" : "bg-cream text-ink"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
        </div>

        {/* Value */}
        <h3
          className={`mt-4 truncate font-space text-[28px] font-bold leading-none tracking-tight sm:text-[32px] ${
            ink ? "text-lime" : "text-ink"
          }`}
        >
          {value}
        </h3>

        {/* Change Indicator */}
        {change && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-space text-[11px] font-bold ${
                change.isPositive
                  ? ink
                    ? "bg-lime text-ink"
                    : "bg-emerald-100 text-emerald-700"
                  : ink
                    ? "bg-red-500/20 text-red-300"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {change.isPositive ? (
                <IconTrendingUp className="h-3.5 w-3.5" />
              ) : (
                <IconTrendingDown className="h-3.5 w-3.5" />
              )}
              {change.isPositive ? "+" : ""}
              {change.value}%
            </span>
            <span className={`text-xs ${ink ? "text-white/45" : "text-black/40"}`}>vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
