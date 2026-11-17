"use client"
import React from 'react'
import { ArrowRight, Star, UserPlus, Users } from '@/components/icons'
import { useAgencyContext } from '../AgencyContext'
import { btnPrimary, cardSubtitle, cardTitle, linkPill } from '../ui'
import { formatMoney } from '@/lib/money'
import { AgencyMigrationNotice, AgentAvatar, formatRating, type TeamOverview } from '../agents/shared'

function TopAgents({ team, loading }: { team: TeamOverview | null; loading: boolean }) {
  const { setCurrentPage } = useAgencyContext()
  const agents = team && team.available ? team.top : []

  return (
    <div className='surface-card flex min-w-0 flex-col gap-4 p-4 sm:p-6 lg:col-span-3'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h2 className={cardTitle}>Top agents</h2>
          <p className={cardSubtitle}>
            {loading ? 'Loading your team…' : team && team.available ? `${team.total} on the team · ${team.online} online` : 'Your courier team'}
          </p>
        </div>
        <button type='button' onClick={() => setCurrentPage('Agents')} className={linkPill}>View all <ArrowRight size={14} /></button>
      </div>

      {loading || !team ? (
        <div className='flex flex-col gap-2' aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='flex animate-pulse items-center gap-3 rounded-2xl p-2'>
              <div className='h-10 w-10 shrink-0 rounded-full bg-black/5' />
              <div className='flex-1 space-y-2'>
                <div className='h-3.5 w-1/2 rounded-full bg-black/5' />
                <div className='h-3 w-1/3 rounded-full bg-black/5' />
              </div>
              <div className='h-4 w-12 rounded-full bg-black/5' />
            </div>
          ))}
        </div>
      ) : !team.available ? (
        <AgencyMigrationNotice>Team stats appear once it has run.</AgencyMigrationNotice>
      ) : agents.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/15 bg-cream/40 px-4 py-10 text-center'>
          <Users size={28} className='text-black/25' />
          <div>
            <p className='font-bold text-ink'>No agents yet</p>
            <p className='mt-1 text-sm text-black/55'>Add couriers to your team to track their deliveries here.</p>
          </div>
          <button type='button' onClick={() => setCurrentPage('Agents')} className={btnPrimary}><UserPlus size={16} /> Add agent</button>
        </div>
      ) : (
        <ol className='flex flex-col divide-y divide-black/5'>
          {agents.map((agent, i) => (
            <li key={agent.id} className='flex items-center gap-3 py-3 first:pt-0 last:pb-0'>
              <span className='w-4 shrink-0 text-center font-space text-xs font-bold text-black/40'>{i + 1}</span>
              <AgentAvatar agent={agent} />
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-semibold text-ink'>{agent.name}</p>
                <p className='flex items-center gap-1 truncate text-xs text-black/55'>
                  <Star size={12} className='shrink-0 text-amber-500' />
                  {formatRating(agent.rating)}
                  <span className='text-black/25'>·</span>
                  {agent.deliveredThisWeek} this week
                </p>
              </div>
              <div className='shrink-0 text-right'>
                <p className='font-space text-sm font-bold text-ink'>{agent.totalDeliveries}</p>
                <p className='text-[11px] text-black/45'>{formatMoney(agent.earningsTotal, 'ngn', { compact: true })}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default TopAgents
