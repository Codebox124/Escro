"use client"
import React from 'react'
import { CircleCheck, Clock4 as Hourglass, FolderKanban, Truck, Users, Wallet as Coins } from '@/components/icons'
import StatCard from '../StatCard'
import { formatMoney } from '@/lib/money'
import type { AgencyOverview } from '../agents/shared'

/** Full naira amount, compacted once it gets too wide for a stat card. */
export function statMoney(amount: number | null | undefined) {
  const n = Number(amount) || 0
  return n >= 10_000_000 ? formatMoney(n, 'ngn', { compact: true }) : formatMoney(n, 'ngn', { decimals: 0 })
}

export function StatSkeleton() {
  return (
    <div className='surface-card flex animate-pulse flex-col gap-5 p-5 sm:p-6' aria-hidden>
      <div className='flex items-start justify-between'>
        <div className='h-3.5 w-24 rounded-full bg-black/5' />
        <div className='h-10 w-10 rounded-xl bg-black/5' />
      </div>
      <div className='h-8 w-32 rounded-full bg-black/5' />
      <div className='h-3 w-20 rounded-full bg-black/5' />
    </div>
  )
}

function DashboardTop({ data, loading }: { data: AgencyOverview | null; loading: boolean }) {
  if (loading || !data) {
    return (
      <div className='grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-6 xl:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)}
      </div>
    )
  }
  const { projects, team } = data
  return (
    <div className='grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-6 xl:grid-cols-3'>
      <StatCard label='Completed value' value={statMoney(projects.completedValue)} icon={Coins} period={`${projects.completed} completed project${projects.completed === 1 ? '' : 's'}`} variant='ink' />
      <StatCard label='Projects' value={projects.total} icon={FolderKanban} period={`${projects.pending} pending · ${projects.declined} declined`} />
      <StatCard label='Active projects' value={projects.active} icon={CircleCheck} period='Accepted and in progress' tone='sky' />
      <StatCard label='Pipeline value' value={statMoney(projects.pipelineValue)} icon={Hourglass} period='Pending + active requests' tone='amber' />
      <StatCard
        label='Team'
        value={team.available ? team.total : '—'}
        icon={Users}
        period={team.available ? `${team.online} online now` : 'Database setup needed'}
        tone={team.available ? 'emerald' : 'amber'}
      />
      <StatCard
        label='Deliveries this week'
        value={team.available ? team.deliveredThisWeek : '—'}
        icon={Truck}
        period={team.available ? `${team.activeDeliveries} in progress` : 'Database setup needed'}
        tone={team.available ? 'emerald' : 'amber'}
      />
    </div>
  )
}

export default DashboardTop
