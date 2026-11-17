"use client"
import React from 'react'
import { BanknoteArrowUp, BanknoteX, Gavel, IconCurrencyNaira, Motorbike, ShieldCheck } from '@/components/icons'
import { formatMoney } from '@/lib/money'
import StatCard from '../StatCard'
import { AdminFinance, StatCardSkeleton } from '../dashboard/shared'

const money = (n: number) => formatMoney(n, 'ngn', { compact: Math.abs(n) >= 1e7 })

function FinanceTop({ totals, days, loading }: { totals: AdminFinance['totals'] | null; days: number; loading: boolean }) {
  const grid = 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3'
  if (loading || !totals) {
    return <div className={grid}>{Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}</div>
  }
  const period = `Last ${days} days`
  return (
    <div className={grid}>
      <StatCard label='Volume in period' value={money(totals.volume)} icon={IconCurrencyNaira} period={`${totals.transactions.toLocaleString()} transactions · ${period}`} />
      <StatCard label='Held in escrow' value={money(totals.held)} icon={ShieldCheck} period='Awaiting delivery confirmation' variant='ink' />
      <StatCard label='Disputed' value={money(totals.disputed)} icon={Gavel} period='Frozen until resolved' tone='amber' />
      <StatCard label='Released to sellers' value={money(totals.released)} icon={BanknoteArrowUp} period={period} />
      <StatCard label='Refunded to buyers' value={money(totals.refunded)} icon={BanknoteX} period={period} tone='red' />
      <StatCard label='Courier earnings' value={money(totals.courierEarnings)} icon={Motorbike} period={period} tone='sky' />
    </div>
  )
}

export default FinanceTop
