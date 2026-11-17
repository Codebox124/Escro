"use client"
import React from 'react'
import { ArrowRight } from '@/components/icons'
import { useAgencyContext } from '../AgencyContext'
import { cardSubtitle, cardTitle, linkPill } from '../ui'
import type { AgencyOverview } from '../agents/shared'

const ROWS = [
  { key: 'pending', label: 'Pending', bar: 'bg-amber-400' },
  { key: 'active', label: 'Active', bar: 'bg-sky-500' },
  { key: 'completed', label: 'Completed', bar: 'bg-ink' },
  { key: 'declined', label: 'Declined', bar: 'bg-red-400' },
] as const

/** Breakdown of service requests by status (from the overview). */
function ProjectPipeline({ projects, loading }: { projects: AgencyOverview['projects'] | null; loading: boolean }) {
  const { setCurrentPage } = useAgencyContext()
  const total = projects?.total ?? 0

  return (
    <div className='surface-card flex min-w-0 flex-col gap-4 p-4 sm:p-6 lg:col-span-3'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h2 className={cardTitle}>Project pipeline</h2>
          <p className={cardSubtitle}>{loading || !projects ? 'Loading…' : `${total} request${total === 1 ? '' : 's'} on your services`}</p>
        </div>
        <button type='button' onClick={() => setCurrentPage('Projects')} className={linkPill}>View all <ArrowRight size={14} /></button>
      </div>
      <div className='flex flex-col gap-4'>
        {ROWS.map((row) => {
          const count = projects ? Number(projects[row.key]) || 0 : 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={row.key}>
              <div className='flex items-center justify-between gap-3 text-sm'>
                <span className='font-semibold text-ink'>{row.label}</span>
                {loading || !projects
                  ? <span className='h-3.5 w-10 animate-pulse rounded-full bg-black/5' />
                  : <span className='font-space font-bold text-ink'>{count}<span className='ml-1.5 text-xs font-medium text-black/45'>{pct}%</span></span>}
              </div>
              <div className='mt-1.5 h-2 w-full overflow-hidden rounded-full bg-cream'>
                <span style={{ width: `${pct}%` }} className={`block h-full rounded-full transition-[width] duration-500 ease-out ${row.bar}`} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProjectPipeline
