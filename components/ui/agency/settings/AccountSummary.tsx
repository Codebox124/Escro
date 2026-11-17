"use client"
import React from 'react'
import { BadgeCheck, CalendarDays, Clock, Star, Truck } from '@/components/icons'
import { cardTitle, monoLabel } from '../ui'
import { AgencyProfile, formatDate, formatRating } from '../agents/shared'

/** Read-only account facts + the (non-self-serve) way to close the agency. */
function AccountSummary({ profile }: { profile: AgencyProfile }) {
  const rows = [
    { icon: CalendarDays, label: 'Member since', value: formatDate(profile.createdAt) },
    { icon: Truck, label: 'Total deliveries', value: String(profile.totalDeliveries ?? 0) },
    { icon: Star, label: 'Rating', value: formatRating(profile.rating) },
  ]
  return (
    <aside className='flex flex-col gap-4 sm:gap-6 xl:sticky xl:top-24'>
      <div className='surface-card p-4 sm:p-6'>
        <h3 className={cardTitle}>Account</h3>
        <div className='mt-4 flex flex-wrap gap-2'>
          {profile.isVerified ? (
            <span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800'><BadgeCheck size={14} /> Verified agency</span>
          ) : (
            <span className='inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800'><Clock size={14} /> Verification pending</span>
          )}
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${profile.isActive === false ? 'bg-red-100 text-red-700' : 'bg-cream text-black/70'}`}>
            {profile.isActive === false ? 'Inactive' : 'Active'}
          </span>
        </div>
        <dl className='mt-5 flex flex-col gap-3 border-t border-black/5 pt-4 text-sm'>
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className='flex items-center justify-between gap-3'>
              <dt className={`flex items-center gap-1.5 ${monoLabel}`}><Icon size={12} /> {label}</dt>
              <dd className='font-space font-bold text-ink'>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className='rounded-3xl border border-red-100 bg-red-50/50 p-4 sm:p-6'>
        <h3 className='text-base font-extrabold tracking-[-0.02em] text-red-700'>Close agency</h3>
        <p className='mt-1 text-sm text-black/60'>Closing an agency can’t be done from the dashboard. Contact Escro support to close your agency.</p>
        <button type='button' disabled className='mt-4 inline-flex h-10 w-full cursor-not-allowed items-center justify-center rounded-full border-2 border-red-200 px-4 text-sm font-bold text-red-400'>
          Contact support to close your agency
        </button>
      </div>
    </aside>
  )
}

export default AccountSummary
