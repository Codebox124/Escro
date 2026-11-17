"use client"
import React from 'react'
import { ArrowRight, Box, CircleStar, Gavel, IconCurrencyNaira, Motorbike, ShieldCheck, Users } from '@/components/icons'
import { formatMoney } from '@/lib/money'
import StatCard from '../StatCard'
import { useAdminContext } from '../AdminContext'
import { AdminOverview, StatCardSkeleton, changeTone, formatChange } from './shared'

const grid = 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4'

function DashboardTop({ data, loading }: { data: AdminOverview | null; loading: boolean }) {
  const { setCurrentPage } = useAdminContext()

  if (loading || !data) {
    return (
      <div className={grid}>
        {Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
    )
  }

  const { users, orders, money, disputes, stores, products, couriers } = data
  const openDisputes = disputes.open || 0

  return (
    <div className={grid}>
      <StatCard
        label='Money in escrow'
        value={formatMoney(money.escrowHeld, 'ngn', { compact: money.escrowHeld >= 1e7 })}
        icon={ShieldCheck}
        period={money.escrowDisputed ? `${formatMoney(money.escrowDisputed, 'ngn', { compact: true })} disputed` : 'Held for open orders'}
        variant='ink'
      />
      <StatCard
        label='Gross merchandise value'
        value={formatMoney(money.gmv, 'ngn', { compact: money.gmv >= 1e7 })}
        icon={IconCurrencyNaira}
        period={`${formatMoney(money.released, 'ngn', { compact: true })} released to sellers`}
      />
      <StatCard
        label='Total users'
        value={users.total.toLocaleString()}
        icon={Users}
        delta={formatChange(users.change)}
        period={`${users.newThisWeek.toLocaleString()} new this week`}
        tone={changeTone(users.change)}
      />
      <StatCard
        label='Orders'
        value={orders.total.toLocaleString()}
        icon={CircleStar}
        delta={formatChange(orders.change)}
        period={`${orders.thisWeek.toLocaleString()} this week`}
        tone={changeTone(orders.change)}
      />

      <button
        type='button'
        onClick={() => setCurrentPage('Disputes')}
        aria-label={`Open disputes: ${openDisputes}. Review disputes`}
        className='group min-w-0 cursor-pointer rounded-3xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60'
      >
        <div className='pointer-events-none h-full [&>div]:h-full'>
          <StatCard
            label='Open disputes'
            value={openDisputes.toLocaleString()}
            icon={Gavel}
            tone={openDisputes > 0 ? 'amber' : 'emerald'}
            period={`${disputes.total.toLocaleString()} total · Review →`}
            variant={openDisputes > 0 ? 'lime' : 'default'}
          />
        </div>
      </button>

      <StatCard
        label='Stores / products'
        value={`${stores.total.toLocaleString()} / ${products.total.toLocaleString()}`}
        icon={Box}
        period={`${stores.verified.toLocaleString()} verified stores · ${products.active.toLocaleString()} active products`}
      />
      <StatCard
        label='Couriers online'
        value={`${couriers.online.toLocaleString()} / ${couriers.total.toLocaleString()}`}
        icon={Motorbike}
        period={couriers.total ? `${Math.round((couriers.online / couriers.total) * 100)}% available now` : 'No couriers yet'}
        tone='sky'
      />
      <button
        type='button'
        onClick={() => setCurrentPage('Finance')}
        className='surface-card card-hover group flex min-w-0 cursor-pointer flex-col justify-between gap-5 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 sm:p-6'
      >
        <p className='text-sm font-semibold text-black/50'>Refunded to buyers</p>
        <p className='truncate font-space text-3xl font-bold tracking-tight text-ink sm:text-4xl'>
          {formatMoney(money.refunded, 'ngn', { compact: money.refunded >= 1e7 })}
        </p>
        <span className='inline-flex items-center gap-1.5 text-xs font-bold text-ink'>
          View finance <ArrowRight size={12} className='transition-transform group-hover:translate-x-0.5' />
        </span>
      </button>
    </div>
  )
}

export default DashboardTop
