"use client"
import React from 'react'
import { ArrowRight, Package, UserPlus } from '@/components/icons'
import { formatMoney } from '@/lib/money'
import { useAdminContext } from '../AdminContext'
import { cardSubtitle, cardTitle, linkPill } from '../ui'
import { AdminOverview, EmptyState, SkeletonBlock, capitalize, formatDate, orderStatusPill, rolePill } from './shared'

function ListSkeleton() {
  return (
    <ul className='flex flex-col gap-2'>
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className='flex items-center gap-3 rounded-2xl bg-cream/40 p-3'>
          <SkeletonBlock className='h-10 w-10 rounded-xl' />
          <div className='flex flex-1 flex-col gap-2'>
            <SkeletonBlock className='h-3.5 w-1/2' />
            <SkeletonBlock className='h-3 w-1/3' />
          </div>
          <SkeletonBlock className='h-5 w-16 rounded-full' />
        </li>
      ))}
    </ul>
  )
}

function initials(name: string | null, email: string) {
  const src = (name || email || '?').trim()
  const parts = src.split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

function RecentOrders({ orders, loading }: { orders: AdminOverview['recentOrders']; loading: boolean }) {
  const { setCurrentPage } = useAdminContext()
  return (
    <div className='surface-card flex min-w-0 flex-col gap-4 p-4 sm:p-6'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h2 className={cardTitle}>Recent orders</h2>
          <p className={cardSubtitle}>Latest orders placed across all stores.</p>
        </div>
        <button type='button' onClick={() => setCurrentPage('Finance')} className={linkPill}>Finance <ArrowRight size={14} /></button>
      </div>
      {loading ? <ListSkeleton /> : orders.length === 0 ? (
        <EmptyState icon={Package} title='No orders yet' message='Orders will appear here once customers check out.' />
      ) : (
        <ul className='flex flex-col gap-2'>
          {orders.map((o) => (
            <li key={o.id} className='flex min-w-0 items-center gap-3 rounded-2xl bg-cream/40 p-3'>
              <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-ink ring-1 ring-black/5'>
                <Package size={16} />
              </span>
              <div className='min-w-0 flex-1'>
                <p className='truncate font-space text-sm font-bold text-ink'>{o.orderNumber || '—'}</p>
                <p className='truncate text-xs text-black/55'>{o.store || 'Unknown store'} · {formatDate(o.createdAt)}</p>
              </div>
              <div className='flex shrink-0 flex-col items-end gap-1'>
                <span className='font-space text-sm font-bold text-ink'>{formatMoney(o.total, 'ngn', { compact: o.total >= 1e6 })}</span>
                <span className={orderStatusPill(o.status)}>{capitalize(o.status)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RecentSignups({ users, loading }: { users: AdminOverview['recentUsers']; loading: boolean }) {
  const { setCurrentPage } = useAdminContext()
  return (
    <div className='surface-card flex min-w-0 flex-col gap-4 p-4 sm:p-6'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h2 className={cardTitle}>Recent sign-ups</h2>
          <p className={cardSubtitle}>Newest accounts on the platform.</p>
        </div>
        <button type='button' onClick={() => setCurrentPage('Users')} className={linkPill}>Users <ArrowRight size={14} /></button>
      </div>
      {loading ? <ListSkeleton /> : users.length === 0 ? (
        <EmptyState icon={UserPlus} title='No sign-ups yet' message='New accounts will show up here.' />
      ) : (
        <ul className='flex flex-col gap-2'>
          {users.map((u) => (
            <li key={u.id} className='flex min-w-0 items-center gap-3 rounded-2xl bg-cream/40 p-3'>
              <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink font-space text-xs font-bold text-lime'>
                {initials(u.name, u.email)}
              </span>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-bold text-ink'>{u.name || 'Unnamed user'}</p>
                <p className='truncate text-xs text-black/55'>{u.email}</p>
              </div>
              <div className='flex shrink-0 flex-col items-end gap-1'>
                <span className={rolePill(u.role)}>{capitalize(u.role)}</span>
                <span className='font-space text-[11px] text-black/45'>{formatDate(u.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DashboardFourth({ data, loading }: { data: AdminOverview | null; loading: boolean }) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2'>
      <RecentOrders orders={data?.recentOrders ?? []} loading={loading} />
      <RecentSignups users={data?.recentUsers ?? []} loading={loading} />
    </div>
  )
}

export default DashboardFourth
