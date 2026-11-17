"use client"
import React from 'react'
import { CircleCheck, CreditCard, DatabaseZap, Loader2, RefreshCw, ServerCrash, TriangleAlert, Zap } from '@/components/icons'
import StatCard from '../StatCard'
import { btnSecondary, monoLabel } from '../ui'
import { LoadError, Section } from './shared'
import { HealthCheck, PlatformHealth, clockTime, formatUptime } from './types'

interface SystemHealthProps {
  health: PlatformHealth | null
  loading: boolean
  error: string | null
  onRefresh: () => void
}

const checkTone = {
  ok: { shell: 'bg-emerald-50 ring-emerald-200', icon: 'bg-emerald-100 text-emerald-700', value: 'text-emerald-800', Icon: CircleCheck },
  warning: { shell: 'bg-amber-50 ring-amber-200', icon: 'bg-amber-100 text-amber-700', value: 'text-amber-800', Icon: TriangleAlert },
  unknown: { shell: 'bg-cream/60 ring-black/5', icon: 'bg-black/5 text-black/40', value: 'text-black/45', Icon: DatabaseZap },
}

function CheckTile({ check }: { check: HealthCheck }) {
  const status = check.status in checkTone ? check.status : 'unknown'
  const t = checkTone[status]
  const Icon = t.Icon
  const value = status === 'unknown' || check.value === null
    ? 'Not available yet'
    : status === 'ok' && check.value === 0 ? 'None' : check.value.toLocaleString('en-NG')
  return (
    <li className={`flex min-w-0 items-start gap-3 rounded-2xl p-4 ring-1 ${t.shell}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.icon}`}><Icon size={16} /></span>
      <div className='min-w-0 flex-1'>
        <p className='text-sm font-bold text-ink'>{check.label}</p>
        {check.hint && <p className='mt-0.5 text-xs text-black/55'>{check.hint}</p>}
      </div>
      <span className={`shrink-0 text-right font-space font-bold ${status === 'warning' ? 'text-xl' : 'text-sm'} ${t.value}`}>{value}</span>
    </li>
  )
}

function HealthSkeleton() {
  return (
    <div className='flex flex-col gap-4' aria-busy='true' aria-label='Running health checks'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        {[0, 1, 2].map((i) => <div key={i} className='h-36 animate-pulse rounded-3xl bg-black/5' />)}
      </div>
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'>
        {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className='h-20 animate-pulse rounded-2xl bg-black/5' />)}
      </div>
    </div>
  )
}

function SystemHealth({ health, loading, error, onRefresh }: SystemHealthProps) {
  const warnings = health?.checks.filter((c) => c.status === 'warning').length ?? 0
  return (
    <Section
      id='settings-health'
      title='System health'
      subtitle={health ? `Checked at ${clockTime(health.checkedAt)}${warnings ? ` · ${warnings} need${warnings === 1 ? 's' : ''} attention` : ' · everything looks fine'}` : 'Live checks against the database and API.'}
      icon={Zap}
      actions={
        <button type='button' onClick={onRefresh} disabled={loading} className={btnSecondary}>
          {loading ? <Loader2 size={16} className='animate-spin' /> : <RefreshCw size={16} />}Re-run checks
        </button>
      }
    >
      {error && !health ? (
        <LoadError message={error} onRetry={onRefresh} />
      ) : !health ? (
        <HealthSkeleton />
      ) : (
        <div className={`flex flex-col gap-5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {error && <p role='alert' className='text-sm font-medium text-red-700'>{error} Showing the last result.</p>}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <StatCard
              label='Database'
              value={health.database.ok ? 'Online' : 'Unreachable'}
              icon={health.database.ok ? DatabaseZap : ServerCrash}
              tone={health.database.ok ? 'emerald' : 'red'}
              period={health.database.ok ? `${health.database.latencyMs} ms latency` : health.database.error || 'The API could not reach Supabase'}
            />
            <StatCard
              label='API uptime'
              value={formatUptime(health.api.uptimeSeconds)}
              icon={Zap}
              period={[health.api.environment, health.api.node && `Node ${health.api.node.replace(/^v/, '')}`].filter(Boolean).join(' · ') || 'Since the last restart'}
            />
            <StatCard
              label='Payments'
              value={health.payments.mode === 'live' ? 'Live mode' : 'Test mode'}
              icon={CreditCard}
              tone={health.payments.stripeConfigured ? 'emerald' : 'amber'}
              period={health.payments.stripeConfigured ? 'Stripe key configured' : 'Stripe key not configured'}
            />
          </div>
          <div className='flex flex-col gap-3'>
            <p className={monoLabel}>Things to keep an eye on</p>
            <ul className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'>
              {health.checks.map((c) => <CheckTile key={c.key} check={c} />)}
            </ul>
          </div>
        </div>
      )}
    </Section>
  )
}

export default SystemHealth
