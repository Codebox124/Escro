"use client"
import React from 'react'
import { Input } from "@/components/ui/input";
import { IconSearch, X } from '@/components/icons'
import { filterBar, searchInput } from '../ui';
import { DisputeTab } from './types';

interface FilterOptionsProps {
  tab: DisputeTab
  onTabChange: (tab: DisputeTab) => void
  counts: Record<DisputeTab, number>
  loading?: boolean
  search: string
  onSearchChange: (value: string) => void
}

const TABS: { value: DisputeTab; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
]

function FilterOptions({ tab, onTabChange, counts, loading = false, search, onSearchChange }: FilterOptionsProps) {
  return (
    <div className={`${filterBar} lg:justify-between`}>
      <div role="tablist" aria-label="Dispute status" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 sm:pb-0">
        {TABS.map((t) => {
          const active = tab === t.value
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(t.value)}
              className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors ${active ? "bg-ink text-white" : "text-black/60 hover:bg-cream hover:text-ink"}`}
            >
              {t.label}
              <span className={`min-w-6 rounded-full px-1.5 py-0.5 text-center font-space text-[11px] ${active ? (t.value === "open" ? "bg-lime text-ink" : "bg-white/15 text-white") : "bg-cream text-black/60"}`}>
                {loading ? "–" : counts[t.value]}
              </span>
            </button>
          )
        })}
      </div>

      <div className="relative min-w-0 flex-1 lg:max-w-sm">
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
        <Input
          type="search"
          value={search}
          aria-label="Search disputes"
          placeholder="Search order #, customer or store..."
          onChange={(e) => onSearchChange(e.target.value)}
          className={`${searchInput} pl-10 pr-10`}
        />
        {search && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-black/45 hover:bg-cream hover:text-ink"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export default FilterOptions
