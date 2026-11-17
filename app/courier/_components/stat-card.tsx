"use client";

import {
  IconTrendingUp,
  IconTrendingDown,
  IconArrowRight,
} from "@/components/icons";
import React from "react";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: "blue" | "amber" | "emerald" | "purple";
  /** Optional highlight surface. Defaults to a white card. */
  tone?: "default" | "ink" | "lime";
  action?: {
    label: string;
    href: string;
  };
  trend?: {
    value: string;
    isPositive: boolean;
    /** Neutral (no change) trend. */
    neutral?: boolean;
  };
  pulsing?: boolean;
  notificationDot?: boolean;
}

const dotColors = {
  blue: "bg-sky-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  purple: "bg-lime-dark",
};

const toneStyles = {
  default: {
    card: "surface-card card-hover text-ink",
    label: "text-black/50",
    sub: "text-black/50",
    iconBox: "bg-cream text-ink",
    link: "text-ink",
    ring: "ring-white",
  },
  ink: {
    card: "surface-ink card-hover",
    label: "text-white/55",
    sub: "text-white/55",
    iconBox: "bg-white/10 text-lime",
    link: "text-lime",
    ring: "ring-ink",
  },
  lime: {
    card: "rounded-3xl bg-lime card-hover text-ink",
    label: "text-ink/60",
    sub: "text-ink/60",
    iconBox: "bg-ink text-lime",
    link: "text-ink",
    ring: "ring-lime",
  },
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  tone = "default",
  action,
  trend,
  pulsing = false,
  notificationDot = false,
}: StatCardProps) => {
  const styles = toneStyles[tone];

  return (
    <div className={`group relative overflow-hidden p-4 sm:p-5 ${styles.card}`}>
      {tone === "ink" && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/25 blur-3xl"
        />
      )}
      <div className="relative flex h-full flex-col">
        {/* Header: Title and Icon */}
        <div className="flex items-start justify-between gap-3">
          <p
            className={`eyebrow pt-1 font-space text-[10px] leading-snug sm:text-[11px] ${styles.label}`}
          >
            {title}
          </p>
          <div className="relative shrink-0">
            <div
              className={`${styles.iconBox} flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-11 ${
                pulsing ? "animate-pulse" : ""
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            {notificationDot && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dotColors[color]} opacity-60`}
                />
                <span
                  className={`relative inline-flex h-3 w-3 rounded-full ${dotColors[color]} ring-2 ${styles.ring}`}
                />
              </span>
            )}
          </div>
        </div>

        {/* Value */}
        <h3 className="mt-4 truncate font-space text-2xl font-bold tracking-tight sm:text-3xl">
          {value}
        </h3>

        {/* Subtitle */}
        {subtitle && (
          <p className={`mt-1 text-xs sm:text-sm ${styles.sub}`}>{subtitle}</p>
        )}

        {/* Trend Indicator */}
        {trend && (
          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-space text-[11px] font-bold ${
                trend.neutral
                  ? "bg-cream text-black/60"
                  : trend.isPositive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {trend.neutral ? null : trend.isPositive ? (
                <IconTrendingUp className="h-3.5 w-3.5" />
              ) : (
                <IconTrendingDown className="h-3.5 w-3.5" />
              )}
              {trend.value}
            </span>
          </div>
        )}

        {/* Action Link */}
        {action && (
          <div className="mt-auto pt-4">
            <Link
              href={action.href}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full text-left text-sm font-bold ${styles.link} transition-all hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60`}
            >
              {action.label}
              <IconArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
