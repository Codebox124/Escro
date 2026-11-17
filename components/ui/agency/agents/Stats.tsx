"use client"
import React from 'react'
import { Truck, Users, Wallet, Zap, PackageCheck } from '@/components/icons'
import { formatMoney } from '@/lib/money'
import { monoLabel } from '../ui'
import type { AgentStats } from './shared'

const TILES = [
  { key: 'total', label: 'Agents', icon: Users, tone: 'bg-cream text-ink' },
  { key: 'online', label: 'Online', icon: Zap, tone: 'bg-emerald-50 text-emerald-700' },
  { key: 'active', label: 'On a delivery', icon: Truck, tone: 'bg-sky-50 text-sky-700' },
  { key: 'deliveredThisWeek', label: 'Delivered this week', icon: PackageCheck, tone: 'bg-cream text-ink' },
  { key: 'earningsTotal', label: 'Team earnings', icon: Wallet, tone: 'bg-amber-50 text-amber-700' },
] as const

function Stats({ stats, loading }: { stats: AgentStats | null; loading: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      {TILES.map(({ key, label, icon: Icon, tone }, i) => (
        <div key={key} className={`surface-card flex min-w-0 items-center gap-3 p-4 ${i === TILES.length - 1 ? 'col-span-2 sm:col-span-1' : ''}`}>
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={16} /></span>
          <div className="min-w-0">
            <p className={`truncate ${monoLabel}`}>{label}</p>
            {loading || !stats ? (
              <div className="mt-1.5 h-6 w-14 animate-pulse rounded-full bg-black/5" />
            ) : (
              <p className="truncate font-space text-2xl font-bold tracking-tight text-ink">
                {key === 'earningsTotal' ? formatMoney(stats.earningsTotal, 'ngn', { compact: true }) : Number(stats[key]) || 0}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Stats
