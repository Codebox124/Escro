"use client"
import React from 'react'
import { ArrowRight, HatGlasses, Motorbike, ShieldCheck, Store, Users } from '@/components/icons'
import { useAdminContext } from '../AdminContext'
import { cardSubtitle, cardTitle, linkPill } from '../ui'
import { AdminOverview, EmptyState, SkeletonBlock } from './shared'

function UserDistribution({ byRole, loading }: { byRole: AdminOverview['users']['byRole'] | null; loading: boolean }) {
  const { setCurrentPage } = useAdminContext()

  const segments = [
    { label: 'Customers', value: byRole?.customer ?? 0, icon: Users, bar: 'bg-ink', soft: 'bg-ink text-lime' },
    { label: 'Sellers', value: byRole?.seller ?? 0, icon: Store, bar: 'bg-lime-dark', soft: 'bg-lime text-ink' },
    { label: 'Couriers', value: byRole?.courier ?? 0, icon: Motorbike, bar: 'bg-sky-500', soft: 'bg-sky-100 text-sky-800' },
    { label: 'Agencies', value: byRole?.agency ?? 0, icon: HatGlasses, bar: 'bg-emerald-600', soft: 'bg-emerald-100 text-emerald-800' },
    { label: 'Admins', value: byRole?.admin ?? 0, icon: ShieldCheck, bar: 'bg-black/20', soft: 'bg-cream text-ink' },
  ]
  const total = segments.reduce((s, x) => s + x.value, 0)

  return (
    <div className='surface-card flex min-w-0 flex-col gap-5 p-4 sm:p-6 lg:col-span-3'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h2 className={cardTitle}>User distribution</h2>
          <p className={cardSubtitle}>{loading ? 'Breakdown of accounts by role.' : `${total.toLocaleString()} accounts by role.`}</p>
        </div>
        <button type='button' onClick={() => setCurrentPage('Users')} className={linkPill}>View all <ArrowRight size={14} /></button>
      </div>

      {loading ? (
        <>
          <SkeletonBlock className='h-2.5 w-full rounded-full' />
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5'>
            {segments.map((s) => <SkeletonBlock key={s.label} className='h-28' />)}
          </div>
        </>
      ) : total === 0 ? (
        <EmptyState icon={Users} title='No users yet' message='Accounts will show up here as people sign up.' />
      ) : (
        <>
          <div className='flex h-2.5 w-full overflow-hidden rounded-full bg-cream' role='img' aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}>
            {segments.map((s) => (
              <span key={s.label} style={{ width: `${(s.value / total) * 100}%` }} className={`${s.bar} h-full transition-[width] duration-500`} />
            ))}
          </div>

          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5'>
            {segments.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className='flex min-w-0 flex-col gap-3 rounded-2xl bg-cream/70 p-4'>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.soft}`}>
                    <Icon size={16} />
                  </span>
                  <div className='min-w-0'>
                    <p className='font-space text-2xl font-bold tracking-tight text-ink'>{s.value.toLocaleString()}</p>
                    <p className='flex items-center gap-1.5 truncate text-sm text-black/55'><span className={`h-2 w-2 shrink-0 rounded-full ${s.bar}`} />{s.label}</p>
                    <p className='mt-0.5 font-space text-[11px] text-black/40'>{Math.round((s.value / total) * 100)}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default UserDistribution
