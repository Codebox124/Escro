"use client"
import React from 'react'
import { IconSearch } from '@/components/icons'
import { filterBar, searchInput } from '../ui'

export type AgentStatusFilter = 'all' | 'online' | 'offline'

const OPTIONS: { value: AgentStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
]

interface FilterOptionsProps {
  query: string
  onQueryChange: (v: string) => void
  status: AgentStatusFilter
  onStatusChange: (v: AgentStatusFilter) => void
  counts: Record<AgentStatusFilter, number>
}

function FilterOptions({ query, onQueryChange, status, onStatusChange, counts }: FilterOptionsProps) {
  return (
    <div className={filterBar}>
      <div className="relative min-w-0 flex-1">
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by name, email, phone or vehicle…"
          aria-label="Search agents"
          className={`${searchInput} pl-10`}
        />
      </div>
      <div role="tablist" aria-label="Filter by status" className="inline-flex w-full shrink-0 rounded-full bg-cream p-1 sm:w-auto">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={status === o.value}
            onClick={() => onStatusChange(o.value)}
            className={`flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 sm:flex-none ${
              status === o.value ? 'bg-ink text-white' : 'text-black/60 hover:text-ink'
            }`}
          >
            {o.label}
            <span className={`font-space text-[11px] ${status === o.value ? 'text-lime' : 'text-black/40'}`}>{counts[o.value]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default FilterOptions
