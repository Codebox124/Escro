"use client"
import React from 'react'
import { useAdminContext } from '../AdminContext'
import { ChevronRight, Gavel, IconCurrencyNaira, Users } from '@/components/icons'
import { cardSubtitle, cardTitle } from '../ui'

const actionClass = 'group flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-2xl bg-cream/60 px-3 py-2.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60'
const iconClass = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-ink ring-1 ring-black/5'

function QuickActions({ openDisputes }: { openDisputes?: number }) {
  const { setCurrentPage } = useAdminContext()

  const actions = [
    {
      label: 'Review disputes',
      hint: openDisputes ? `${openDisputes} open` : 'Settle buyer/seller claims',
      page: 'Disputes',
      icon: Gavel,
      iconCls: openDisputes ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-200' : iconClass,
    },
    { label: 'Manage users', hint: 'Verify, activate or change roles', page: 'Users', icon: Users, iconCls: iconClass },
    { label: 'View finance', hint: 'Escrow, payouts and transactions', page: 'Finance', icon: IconCurrencyNaira, iconCls: iconClass },
  ]

  return (
    <div className='surface-card flex min-w-0 flex-col gap-4 p-4 sm:p-6 lg:col-span-2'>
      <div>
        <h2 className={cardTitle}>Quick actions</h2>
        <p className={cardSubtitle}>Jump straight to common admin tasks.</p>
      </div>
      <div className='grid grid-cols-1 gap-2'>
        {actions.map((a) => {
          const Icon = a.icon
          return (
            <button key={a.page} type='button' onClick={() => setCurrentPage(a.page)} className={actionClass}>
              <span className={a.iconCls}><Icon size={16} /></span>
              <span className='flex min-w-0 flex-col'>
                <span>{a.label}</span>
                <span className='truncate text-xs font-medium text-black/50'>{a.hint}</span>
              </span>
              <ChevronRight size={16} className='ml-auto shrink-0 text-black/40 transition-transform group-hover:translate-x-0.5 group-hover:text-ink' />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default QuickActions
