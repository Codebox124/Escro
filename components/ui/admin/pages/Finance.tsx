"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { adminApi } from '@/services/admin'
import { formatMoney } from '@/lib/money'
import { Download, TestTube2 } from '@/components/icons'
import FinanceTop from '../finance/FinanceTop'
import FilterOptions, { EscrowFilter } from '../finance/FilterOptions'
import TransactionsTable from '../finance/TransactionsTable'
import { ChartBarDefault } from '../BarChart'
import PageHeader from '../PageHeader'
import { btnPrimary, cardSubtitle, cardTitle, pageWrapper } from '../ui'
import { AdminFinance, ErrorCard, FinanceTransaction, errorMessage } from '../dashboard/shared'

const PERIODS = [7, 30, 90, 365] as const
type Period = (typeof PERIODS)[number]

function csvCell(value: unknown) {
  const s = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function exportCsv(rows: FinanceTransaction[], days: number) {
  const header = ['Order number', 'Store', 'Customer', 'Customer email', 'Amount (NGN)', 'Escrow status', 'Order status', 'Created at', 'Released at', 'Refunded at']
  const lines = rows.map((t) => [
    t.orderNumber, t.store, t.customer?.name, t.customer?.email, t.amount, t.status, t.orderStatus, t.createdAt, t.releasedAt, t.refundedAt,
  ].map(csvCell).join(','))
  const blob = new Blob([[header.join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `escro-transactions-${days}d-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function Finance() {
  const [days, setDays] = useState<Period>(30)
  const [data, setData] = useState<AdminFinance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<EscrowFilter>('all')
  const requestId = useRef(0)

  const load = useCallback(async (period: Period) => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const res = (await adminApi.finance(period)) as AdminFinance
      if (id === requestId.current) setData(res)
    } catch (err) {
      if (id === requestId.current) setError(errorMessage(err, 'Could not load finance data.'))
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(days)
  }, [days, load])

  const transactions = useMemo(() => data?.transactions ?? [], [data])
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return transactions.filter((t) => {
      if (status !== 'all' && t.status !== status) return false
      if (!q) return true
      return [t.orderNumber, t.store, t.customer?.name, t.customer?.email]
        .some((v) => (v || '').toLowerCase().includes(q))
    })
  }, [transactions, search, status])

  const chart = (data?.chart ?? []).map((d) => ({ label: d.label, value: Number(d.volume) || 0 }))
  const showSkeleton = loading
  const shownDays = data?.days ?? days

  const periodSelector = (
    <div role='radiogroup' aria-label='Reporting period' className='inline-flex w-full rounded-full bg-white p-1 ring-1 ring-black/10 sm:w-auto'>
      {PERIODS.map((p) => (
        <button
          key={p}
          type='button'
          role='radio'
          aria-checked={days === p}
          onClick={() => setDays(p)}
          className={`h-9 flex-1 cursor-pointer whitespace-nowrap rounded-full px-3.5 font-space text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 sm:flex-none ${days === p ? 'bg-ink text-lime' : 'text-black/60 hover:text-ink'}`}
        >
          {p === 365 ? '1Y' : `${p}D`}
        </button>
      ))}
    </div>
  )

  return (
    <div className={pageWrapper}>
      <PageHeader
        title='Finance'
        subtitle='Escrow volume, payouts, refunds and every transaction moving through Escro.'
        actions={periodSelector}
      />

      {data?.testMode && (
        <p className='inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800'>
          <TestTube2 size={14} /> Test mode — no real money moved
        </p>
      )}

      {error && !data ? (
        <ErrorCard title="Couldn't load finance" message={error} onRetry={() => load(days)} />
      ) : (
        <>
          {error && (
            <div role='alert' className='flex flex-col gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:flex-row sm:items-center sm:justify-between'>
              <span>{error} Showing the last loaded data.</span>
              <button type='button' onClick={() => load(days)} className='w-fit cursor-pointer underline underline-offset-2'>Retry</button>
            </div>
          )}
          <FinanceTop totals={data?.totals ?? null} days={shownDays} loading={showSkeleton} />
          <ChartBarDefault
            eyebrow={`Last ${shownDays} days · Daily`}
            title='Escrow volume'
            data={chart}
            loading={showSkeleton}
            seriesLabel='Volume'
            badge={data ? `${formatMoney(data.totals.volume, 'ngn', { compact: true })} total` : undefined}
            emptyMessage='No escrow payments in this period.'
          />

          <section className='flex min-w-0 flex-col gap-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
              <div className='min-w-0'>
                <h2 className={cardTitle}>Transactions</h2>
                <p className={cardSubtitle}>
                  {loading ? 'Loading…' : `${rows.length.toLocaleString()} of ${transactions.length.toLocaleString()} shown`}
                </p>
              </div>
              <button
                type='button'
                onClick={() => exportCsv(rows, shownDays)}
                disabled={loading || rows.length === 0}
                className={`${btnPrimary} w-full sm:w-auto`}
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
            <FilterOptions
              search={search}
              onSearchChange={setSearch}
              status={status}
              onStatusChange={setStatus}
              disabled={loading && !data}
            />
            <TransactionsTable rows={rows} loading={showSkeleton} filtered={transactions.length > 0} />
          </section>
        </>
      )}
    </div>
  )
}

export default Finance
