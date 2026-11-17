"use client"
import React from 'react'
import { BanknoteArrowUp, BanknoteX, Gavel, IconCurrencyNaira, IconPercentage, Motorbike, ShieldCheck } from '@/components/icons'
import { formatMoney } from '@/lib/money'
import StatCard from '../StatCard'
import { AdminFinance, StatCardSkeleton } from '../dashboard/shared'

const money = (n: number) => formatMoney(n, 'ngn', { compact: Math.abs(n) >= 1e7 })

type FinanceTotals = AdminFinance['totals'] & {
  /** Escro commission earned in the period */
  commission?: number
  commissionAllTime?: number
  /** false until migration 007_wallets.sql is run */
  walletsAvailable?: boolean
}

function FinanceTop({ totals, days, loading }: { totals: FinanceTotals | null; days: number; loading: boolean }) {
  const grid = 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3'
  if (loading || !totals) {
    return <div className={grid}>{Array.from({ length: 7 }).map((_, i) => <StatCardSkeleton key={i} />)}</div>
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
      <div className='sm:col-span-2 xl:col-span-3'>
        {totals.walletsAvailable === false ? (
          <StatCard label='Escro commission' value='—' icon={IconPercentage} period='Run migration 007' tone='amber' />
        ) : (
          <StatCard
            label='Escro commission'
            value={money(totals.commission ?? 0)}
            icon={IconPercentage}
            period={`${period} · ${money(totals.commissionAllTime ?? 0)} all time`}
            variant='lime'
          />
        )}
      </div>
    </div>
  )
}

export default FinanceTop
