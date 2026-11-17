"use client"
import React from 'react'
import { CalendarDays, CircleAlert, Gavel, Mail, Phone, RefreshCw, Scale, ShieldCheck, Store, UserRound } from '@/components/icons'
import { formatMoney } from '@/lib/money'
import { btnPrimary, monoLabel } from '../ui'
import { formatDate } from '../users/types'
import { AdminDispute, DisputeTab, disputePill, escrowPill, reasonLabel } from './types'

interface DisputesListProps {
  disputes: AdminDispute[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  onResolve?: (dispute: AdminDispute) => void
  tab?: DisputeTab
  searching?: boolean
}

function DisputesList({ disputes, loading = false, error, onRetry, onResolve, tab = "open", searching = false }: DisputesListProps) {
  if (error) {
    return (
      <div role="alert" className='surface-card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center'>
        <span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600'><CircleAlert size={22} /></span>
        <div>
          <p className='font-bold text-ink'>Couldn&apos;t load disputes</p>
          <p className='mt-1 max-w-md text-sm text-black/55'>{error}</p>
        </div>
        {onRetry && <button type='button' onClick={onRetry} className={btnPrimary}><RefreshCw size={16} /> Try again</button>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className='grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2' aria-busy="true" aria-label="Loading disputes">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='surface-card flex flex-col gap-4 p-5 sm:p-6'>
            <div className='flex items-center gap-3'>
              <span className='h-10 w-10 animate-pulse rounded-xl bg-black/10' />
              <div className='flex flex-1 flex-col gap-2'>
                <span className='h-4 w-32 animate-pulse rounded bg-black/10' />
                <span className='h-3 w-20 animate-pulse rounded bg-black/5' />
              </div>
              <span className='h-6 w-16 animate-pulse rounded-full bg-black/5' />
            </div>
            <span className='h-16 animate-pulse rounded-2xl bg-black/5' />
            <div className='grid grid-cols-2 gap-3'>
              <span className='h-20 animate-pulse rounded-2xl bg-black/5' />
              <span className='h-20 animate-pulse rounded-2xl bg-black/5' />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (disputes.length === 0) {
    const nice = !searching && (tab === "open" || tab === "all")
    return (
      <div className='surface-card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center'>
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${nice ? "bg-lime text-ink" : "bg-cream text-black/40"}`}>{nice ? <ShieldCheck size={22} /> : <Scale size={22} />}</span>
        <div>
          <p className='font-bold text-ink'>{searching ? "No disputes match your search" : nice ? "No disputes — nice" : `No ${tab} disputes`}</p>
          <p className='mt-1 text-sm text-black/55'>{searching ? "Try a different order number, customer or store." : nice ? "Every escrow is flowing smoothly right now." : "Closed disputes will appear here."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2'>
      {disputes.map((d) => <DisputeCard key={d.id} dispute={d} onResolve={onResolve} />)}
    </div>
  )
}

function DisputeCard({ dispute: d, onResolve }: { dispute: AdminDispute; onResolve?: (d: AdminDispute) => void }) {
  const isOpen = (d.status || "").toLowerCase() === "open"
  const amount = d.order?.total ?? d.escrow?.amount ?? 0

  return (
    <article className='surface-card flex min-w-0 flex-col overflow-hidden'>
      <header className='flex flex-wrap items-start justify-between gap-3 border-b border-black/5 p-4 sm:px-6'>
        <div className='flex min-w-0 items-center gap-3'>
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isOpen ? "bg-amber-50 text-amber-600" : "bg-cream text-ink"}`}><Scale size={18} /></span>
          <div className='min-w-0'>
            <p className='truncate font-space font-bold text-ink'>#{d.order?.orderNumber ?? d.order?.id ?? "—"}</p>
            <p className='font-space text-lg font-bold tracking-tight text-ink'>{formatMoney(amount, "ngn")}</p>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-1.5'>
          <span className={disputePill(d.status)}>{d.status}</span>
          {d.escrow?.status && <span className={escrowPill(d.escrow.status)}>Escrow · {d.escrow.status}</span>}
        </div>
      </header>

      <div className='flex flex-1 flex-col gap-3 p-4 sm:px-6'>
        <div className='rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200/70'>
          <p className='font-space text-[11px] uppercase tracking-widest text-amber-800'>Reason</p>
          <p className='mt-1 font-bold text-ink'>{reasonLabel(d.reason)}</p>
          {d.details && <p className='mt-1.5 whitespace-pre-line break-words text-sm text-black/70'>{d.details}</p>}
        </div>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <div className='min-w-0 rounded-2xl bg-cream/70 p-4'>
            <p className={`${monoLabel} flex items-center gap-1.5`}><UserRound size={12} />Customer</p>
            {d.customer ? (
              <div className='mt-1 flex min-w-0 flex-col gap-1 text-sm'>
                <span className='truncate font-semibold text-ink'>{d.customer.name || "Unnamed customer"}</span>
                {d.customer.email && <a href={`mailto:${d.customer.email}`} className='flex min-w-0 items-center gap-1.5 text-black/60 hover:text-ink hover:underline'><Mail size={13} className='shrink-0' /><span className='truncate'>{d.customer.email}</span></a>}
                {d.customer.phone && <a href={`tel:${d.customer.phone}`} className='flex min-w-0 items-center gap-1.5 text-black/60 hover:text-ink hover:underline'><Phone size={13} className='shrink-0' /><span className='truncate'>{d.customer.phone}</span></a>}
              </div>
            ) : <p className='mt-1 text-sm text-black/45'>Deleted account</p>}
          </div>
          <div className='min-w-0 rounded-2xl bg-cream/70 p-4'>
            <p className={`${monoLabel} flex items-center gap-1.5`}><Store size={12} />Store</p>
            <p className='mt-1 truncate text-sm font-semibold text-ink'>{d.store?.name ?? <span className='font-normal text-black/45'>Unknown store</span>}</p>
            {d.order?.status && <p className='mt-1 text-xs capitalize text-black/55'>Order {d.order.status.replace(/_/g, " ")}</p>}
          </div>
        </div>

        {!isOpen && (d.resolution || d.resolvedAt) && (
          <div className='rounded-2xl bg-emerald-50/70 p-4 ring-1 ring-emerald-200/70'>
            <p className='flex items-center justify-between gap-2 font-space text-[11px] uppercase tracking-widest text-emerald-800'>
              <span>Resolution</span>
              {d.resolvedAt && <span className='normal-case tracking-normal'>{formatDate(d.resolvedAt, true)}</span>}
            </p>
            {d.resolution && <p className='mt-1 whitespace-pre-line break-words text-sm text-ink'>{d.resolution}</p>}
          </div>
        )}
      </div>

      <footer className='flex flex-col gap-3 border-t border-black/5 bg-cream/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
        <span className='flex items-center gap-1.5 text-xs text-black/55'><CalendarDays size={14} />Opened {formatDate(d.createdAt, true)}</span>
        {isOpen && (
          <button type='button' onClick={() => onResolve?.(d)} className={`${btnPrimary} w-full sm:w-auto`}><Gavel size={16} />Resolve</button>
        )}
      </footer>
    </article>
  )
}

export default DisputesList
