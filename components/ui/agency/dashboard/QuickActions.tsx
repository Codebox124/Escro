"use client"
import React from 'react'
import { useAgencyContext } from '../AgencyContext';
import { ChevronRight, FolderKanban, MessageSquare, UserPlus } from '@/components/icons';
import { cardSubtitle, cardTitle } from '../ui';

const actionClass = 'group flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-2xl bg-cream/60 px-3 py-2.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60'
const iconClass = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-ink ring-1 ring-black/5'

const ACTIONS = [
  { label: 'Add agent', hint: 'Grow your courier team', page: 'Agents', icon: UserPlus },
  { label: 'View projects', hint: 'Requests on your services', page: 'Projects', icon: FolderKanban },
  { label: 'Messages', hint: 'Talk to your clients', page: 'Messages', icon: MessageSquare },
] as const

function QuickActions() {
  const { setCurrentPage } = useAgencyContext()
  return (
    <div className='surface-card flex min-w-0 flex-col gap-4 p-4 sm:p-6 lg:col-span-2'>
      <div>
        <h2 className={cardTitle}>Quick actions</h2>
        <p className={cardSubtitle}>Shortcuts for everyday agency work.</p>
      </div>
      <div className='flex flex-col gap-2'>
        {ACTIONS.map(({ label, hint, page, icon: Icon }) => (
          <button key={label} type='button' onClick={() => setCurrentPage(page)} className={actionClass}>
            <span className={iconClass}><Icon size={16} /></span>
            <span className='min-w-0'>
              <span className='block truncate'>{label}</span>
              <span className='block truncate text-xs font-medium text-black/50'>{hint}</span>
            </span>
            <ChevronRight size={16} className='ml-auto shrink-0 text-black/40 transition-transform group-hover:translate-x-0.5 group-hover:text-ink' />
          </button>
        ))}
      </div>
    </div>
  )
}

export default QuickActions
