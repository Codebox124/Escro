"use client";

import Link from "next/link";
import { motion } from "motion/react";

export type BottomNavItem = {
  label: string;
  icon: React.ElementType;
  active: boolean;
  /** Route link … */
  href?: string;
  /** … or an action (e.g. switching a view in a single-page dashboard) */
  onClick?: () => void;
  badge?: number;
};

/**
 * Mobile / tablet bottom navigation (hidden from lg up, where the sidebar or
 * top nav takes over). Pages using it should add bottom padding on small
 * screens — the `pb-bottom-nav` utility in globals.css does that.
 */
export default function BottomNav({ items, id = "bottom-nav" }: { items: BottomNavItem[]; id?: string }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch gap-1 rounded-[28px] bg-ink/95 p-1.5 shadow-2xl shadow-black/30 ring-1 ring-white/10 backdrop-blur-xl">
        {items.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              <span className="relative flex h-8 w-12 items-center justify-center">
                {item.active && (
                  <motion.span
                    // must not match the sidebar/top-nav pill ids, or the shared-layout
                    // animation steals the pill from the (visible) desktop menu
                    layoutId={`${id}-bottom-pill`}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-lime"
                  />
                )}
                <Icon className={`relative h-5 w-5 ${item.active ? "text-ink" : "text-white/55"}`} />
                {!!item.badge && item.badge > 0 && (
                  <span className="absolute -right-0.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime px-1 font-space text-[9px] font-bold text-ink ring-2 ring-ink">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </span>
              <span
                className={`max-w-full truncate text-[10px] leading-none ${
                  item.active ? "font-bold text-white" : "font-medium text-white/50"
                }`}
              >
                {item.label}
              </span>
            </>
          );
          const cls =
            "flex min-h-[56px] w-full flex-col items-center justify-center gap-1 rounded-[22px] px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60 active:bg-white/5";
          return (
            <li key={item.label} className="min-w-0 flex-1">
              {item.href ? (
                <Link href={item.href} aria-current={item.active ? "page" : undefined} className={cls}>
                  {content}
                </Link>
              ) : (
                <button type="button" onClick={item.onClick} aria-current={item.active ? "page" : undefined} className={cls}>
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
