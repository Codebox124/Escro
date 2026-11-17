"use client"
import React from 'react'
import { Users } from '@/components/icons'
import { ROLES, ROLE_META, UserCounts, UserRoleFilter } from './types'

interface StatsProps {
  counts?: UserCounts | null
  loading?: boolean
  /** Highlights the tile that matches the active role filter */
  activeRole?: UserRoleFilter
  onSelectRole?: (role: UserRoleFilter) => void
}

function Stats({ counts, loading = false, activeRole = "all", onSelectRole }: StatsProps) {
  const total = ROLES.reduce((sum, r) => sum + (counts?.[r] ?? 0), 0)
  const tiles: { key: UserRoleFilter; label: string; value: number; icon: React.ElementType }[] = [
    { key: "all", label: "Total users", value: total, icon: Users },
    ...ROLES.map((r) => ({ key: r as UserRoleFilter, label: ROLE_META[r].plural, value: counts?.[r] ?? 0, icon: ROLE_META[r].icon })),
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
      {tiles.map(({ key, label, value, icon: Icon }) => {
        const active = activeRole === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelectRole?.(key)}
            aria-pressed={active}
            className={`flex min-w-0 cursor-pointer items-center gap-3 p-4 text-left transition-shadow ${active ? "rounded-3xl bg-ink text-white" : "surface-card card-hover"}`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-white/10 text-lime" : "bg-cream text-ink"}`}><Icon size={16} className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className={`truncate font-space text-[11px] uppercase tracking-widest ${active ? "text-white/60" : "text-black/45"}`}>{label}</p>
              {loading && !counts ? (
                <span className="mt-1 block h-7 w-12 animate-pulse rounded-lg bg-black/10" />
              ) : (
                <p className={`font-space text-2xl font-bold tracking-tight ${active ? "text-white" : "text-ink"}`}>{value.toLocaleString("en-NG")}</p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default Stats
