"use client"
import React from 'react'
import { IconReceipt } from '@/components/icons'
import { formatMoney } from '@/lib/money'
import { EmptyState, FinanceTransaction, SkeletonBlock, capitalize, escrowPill, formatDate } from '../dashboard/shared'

interface TransactionsTableProps {
  rows: FinanceTransaction[]
  loading: boolean
  /** true when there are transactions but filters hide them all */
  filtered: boolean
}

const th = 'px-4 py-3 text-left font-space text-[11px] font-bold uppercase tracking-widest text-black/45'
const td = 'px-4 py-3 align-middle'

function TransactionsTable({ rows, loading, filtered }: TransactionsTableProps) {
  if (loading) {
    return (
      <div className='surface-card flex flex-col gap-2 p-4 sm:p-6'>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className='h-12 w-full' />)}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className='surface-card p-4 sm:p-6'>
        <EmptyState
          icon={IconReceipt}
          title={filtered ? 'No matching transactions' : 'No transactions in this period'}
          message={filtered ? 'Try a different search or status filter.' : 'Escrow transactions will appear here as orders are paid.'}
        />
      </div>
    )
  }

  return (
    <div className='surface-card min-w-0 overflow-hidden'>
      {/* Mobile: cards */}
      <ul className='flex flex-col divide-y divide-black/5 md:hidden'>
        {rows.map((t) => (
          <li key={t.id} className='flex flex-col gap-2 p-4'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <p className='truncate font-space text-sm font-bold text-ink'>{t.orderNumber || '—'}</p>
                <p className='truncate text-xs text-black/55'>{t.store || 'Unknown store'}</p>
              </div>
              <span className='shrink-0 font-space text-sm font-bold text-ink'>{formatMoney(t.amount, 'ngn')}</span>
            </div>
            <div className='flex items-center justify-between gap-3'>
              <p className='min-w-0 truncate text-xs text-black/55'>{t.customer?.name || t.customer?.email || 'Unknown customer'} · {formatDate(t.createdAt, true)}</p>
              <span className={escrowPill(t.status)}>{capitalize(t.status)}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className='hidden overflow-x-auto md:block'>
        <table className='w-full min-w-[760px] text-sm'>
          <thead className='bg-cream/60'>
            <tr>
              <th scope='col' className={th}>Order</th>
              <th scope='col' className={th}>Store</th>
              <th scope='col' className={th}>Customer</th>
              <th scope='col' className={`${th} text-right`}>Amount</th>
              <th scope='col' className={th}>Escrow</th>
              <th scope='col' className={th}>Date</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-black/5'>
            {rows.map((t) => (
              <tr key={t.id} className='transition-colors hover:bg-cream/40'>
                <td className={`${td} font-space font-bold text-ink`}>{t.orderNumber || '—'}</td>
                <td className={`${td} max-w-[12rem] truncate text-black/70`}>{t.store || '—'}</td>
                <td className={`${td} max-w-[14rem]`}>
                  <p className='truncate font-semibold text-ink'>{t.customer?.name || '—'}</p>
                  {t.customer?.email && <p className='truncate text-xs text-black/50'>{t.customer.email}</p>}
                </td>
                <td className={`${td} whitespace-nowrap text-right font-space font-bold text-ink`}>{formatMoney(t.amount, 'ngn')}</td>
                <td className={td}><span className={escrowPill(t.status)}>{capitalize(t.status)}</span></td>
                <td className={`${td} whitespace-nowrap text-black/60`}>{formatDate(t.createdAt, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TransactionsTable
