"use client"
import React, { useMemo } from 'react'
import { Ban, CheckCircle, ClipboardClock, FolderKanban, Wallet } from '@/components/icons'
import { formatMoney } from '@/lib/money'
import StatCard from '../StatCard'
import { bucketOf, requestValue, type ServiceRequest } from './types'

function Stats({ requests, loading }: { requests: ServiceRequest[]; loading?: boolean }) {
  const s = useMemo(() => {
    const counts = { pending: 0, accepted: 0, completed: 0, declined: 0 }
    let completedValue = 0
    const currencies = new Set<string>()
    requests.forEach((r) => {
      const b = bucketOf(r.status)
      if (b !== 'all') counts[b] += 1
      if (r.status === 'completed') {
        completedValue += requestValue(r)
        currencies.add((r.service?.currency || 'ngn').toLowerCase())
      }
    })
    const currency = currencies.size === 1 ? [...currencies][0] : 'ngn'
    return { counts, completedValue, currency }
  }, [requests])

  const v = (n: number) => (loading ? '—' : n)

  return (
    <div className='grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5'>
      <StatCard label='Pending' value={v(s.counts.pending)} icon={ClipboardClock} tone='amber' />
      <StatCard label='In progress' value={v(s.counts.accepted)} icon={FolderKanban} tone='sky' />
      <StatCard label='Completed' value={v(s.counts.completed)} icon={CheckCircle} />
      <StatCard label='Declined' value={v(s.counts.declined)} icon={Ban} tone='red' />
      <div className='col-span-2 lg:col-span-1'>
        <StatCard
          label='Completed value'
          value={loading ? '—' : formatMoney(s.completedValue, s.currency, { compact: s.completedValue >= 1_000_000 })}
          icon={Wallet}
          variant='ink'
        />
      </div>
    </div>
  )
}

export default Stats
