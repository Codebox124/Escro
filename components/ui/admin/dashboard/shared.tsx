"use client"
import React from 'react'
import { IconRefresh, ServerCrash } from '@/components/icons'
import { btnPrimary, cardSubtitle, cardTitle } from '../ui'

// ---------- API shapes (services/admin.js) ----------

export type Role = 'customer' | 'seller' | 'courier' | 'agency' | 'admin'

export interface AdminOverview {
  users: { total: number; byRole: Partial<Record<Role, number>>; newThisWeek: number; change: number; inactive: number }
  stores: { total: number; verified: number }
  products: { total: number; active: number }
  orders: { total: number; thisWeek: number; change: number; byStatus: Record<string, number> }
  money: { gmv: number; completedValue: number; escrowHeld: number; escrowDisputed: number; released: number; refunded: number }
  disputes: { open: number; total: number }
  couriers: { total: number; online: number }
  chart: { label: string; gmv: number; orders: number }[]
  recentUsers: { id: string; name: string | null; email: string; role: Role; createdAt: string }[]
  recentOrders: { id: string; orderNumber: string; status: string; total: number; store: string | null; createdAt: string }[]
}

export type EscrowStatus = 'held' | 'released' | 'refunded' | 'disputed'

export interface FinanceTransaction {
  id: string
  status: EscrowStatus
  amount: number
  orderId: string | null
  orderNumber: string | null
  orderStatus: string | null
  store: string | null
  customer: { name: string | null; email: string | null } | null
  createdAt: string
  heldAt?: string | null
  releasedAt?: string | null
  refundedAt?: string | null
}

export interface AdminFinance {
  days: number
  totals: { volume: number; held: number; disputed: number; released: number; refunded: number; courierEarnings: number; transactions: number }
  chart: { date: string; label: string; volume: number }[]
  transactions: FinanceTransaction[]
  testMode?: boolean
}

// ---------- helpers ----------

export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.') {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message || fallback
  }
  return fallback
}

export function formatDate(value: string | null | undefined, withYear = false) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) })
}

export function formatChange(change: number | null | undefined) {
  const n = Number(change) || 0
  return `${n > 0 ? '+' : ''}${n}%`
}

export const changeTone = (change: number | null | undefined): 'emerald' | 'red' | 'amber' =>
  (Number(change) || 0) > 0 ? 'emerald' : (Number(change) || 0) < 0 ? 'red' : 'amber'

export function capitalize(value: string | null | undefined) {
  if (!value) return '—'
  const s = value.replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const pillBase = 'inline-flex w-fit items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold'

export function orderStatusPill(status: string) {
  const s = (status || '').toLowerCase()
  if (['delivered', 'completed'].includes(s)) return `${pillBase} bg-emerald-100 text-emerald-800`
  if (['confirmed', 'processing', 'shipped'].includes(s)) return `${pillBase} bg-sky-100 text-sky-800`
  if (s === 'pending') return `${pillBase} bg-amber-100 text-amber-800`
  if (['cancelled', 'refunded'].includes(s)) return `${pillBase} bg-red-100 text-red-700`
  return `${pillBase} bg-cream text-black/70`
}

export function escrowPill(status: string) {
  const s = (status || '').toLowerCase()
  if (s === 'released') return `${pillBase} bg-emerald-100 text-emerald-800`
  if (s === 'held') return `${pillBase} bg-sky-100 text-sky-800`
  if (s === 'disputed') return `${pillBase} bg-amber-100 text-amber-800`
  if (s === 'refunded') return `${pillBase} bg-red-100 text-red-700`
  return `${pillBase} bg-cream text-black/70`
}

export function rolePill(role: string) {
  const r = (role || '').toLowerCase()
  if (r === 'seller') return `${pillBase} bg-lime text-ink`
  if (r === 'courier') return `${pillBase} bg-sky-100 text-sky-800`
  if (r === 'agency') return `${pillBase} bg-emerald-100 text-emerald-800`
  if (r === 'admin') return `${pillBase} bg-ink text-lime`
  return `${pillBase} bg-cream text-black/70`
}

// ---------- states ----------

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-2xl bg-black/[0.06] ${className}`} />
}

export function StatCardSkeleton() {
  return (
    <div className='surface-card flex min-w-0 flex-col gap-5 p-5 sm:p-6'>
      <div className='flex items-start justify-between gap-3'>
        <SkeletonBlock className='h-4 w-28' />
        <SkeletonBlock className='h-10 w-10 rounded-xl' />
      </div>
      <SkeletonBlock className='h-9 w-36' />
      <SkeletonBlock className='h-6 w-24 rounded-full' />
    </div>
  )
}

export function ErrorCard({ title = "Couldn't load data", message, onRetry }: { title?: string; message: string; onRetry: () => void }) {
  return (
    <div role='alert' className='surface-card flex flex-col items-center gap-4 p-8 text-center sm:p-10'>
      <span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600'>
        <ServerCrash size={22} />
      </span>
      <div>
        <h2 className={cardTitle}>{title}</h2>
        <p className={`${cardSubtitle} max-w-md`}>{message}</p>
      </div>
      <button type='button' onClick={onRetry} className={btnPrimary}>
        <IconRefresh size={16} /> Try again
      </button>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, message }: { icon: React.ElementType; title: string; message?: string }) {
  return (
    <div className='flex flex-col items-center gap-3 rounded-2xl bg-cream/60 px-4 py-10 text-center'>
      <span className='flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black/50 ring-1 ring-black/5'>
        <Icon size={18} />
      </span>
      <div>
        <p className='text-sm font-bold text-ink'>{title}</p>
        {message && <p className='mt-0.5 text-sm text-black/55'>{message}</p>}
      </div>
    </div>
  )
}
