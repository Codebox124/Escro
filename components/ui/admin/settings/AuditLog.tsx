"use client"
import React, { useEffect, useState } from 'react'
import { Gavel, Loader2, RefreshCw, ScrollText, Settings as SettingsIcon, UserRound } from '@/components/icons'
import { adminSettingsApi } from '@/services/admin'
import { formatMoney } from '@/lib/money'
import { btnSecondary } from '../ui'
import { errorMessage } from '../users/types'
import { LoadError, Section, SetupNotice, SkeletonRows } from './shared'
import { AuditEntry, AuditResponse, relativeTime } from './types'

const ACTIONS: Record<string, { label: string; icon: React.ElementType; tone: string }> = {
  'user.update': { label: 'Updated user', icon: UserRound, tone: 'bg-sky-50 text-sky-700' },
  'dispute.resolve': { label: 'Resolved dispute', icon: Gavel, tone: 'bg-amber-50 text-amber-700' },
  'settings.update': { label: 'Changed platform settings', icon: SettingsIcon, tone: 'bg-cream text-ink' },
}

function actionMeta(action: string) {
  return ACTIONS[action] ?? {
    label: action.replace(/[._]/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
    icon: ScrollText,
    tone: 'bg-cream text-ink',
  }
}

type Details = Record<string, unknown>
const obj = (v: unknown): Details | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Details) : null)
const str = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '')
const onOff = (v: unknown, on: string, off: string) => (v ? on : off)

function target(entry: AuditEntry): string {
  const d = obj(entry.details) ?? {}
  if (entry.action === 'user.update') return str(d.email) || (entry.targetId ? `User ${entry.targetId.slice(0, 8)}` : 'User')
  if (entry.action === 'dispute.resolve') return d.orderNumber ? `Order #${str(d.orderNumber)}` : 'Dispute'
  if (entry.action === 'settings.update') return 'Platform'
  return [entry.targetType, entry.targetId?.slice(0, 8)].filter(Boolean).join(' ') || '—'
}

function summary(entry: AuditEntry): string[] {
  const d = obj(entry.details)
  if (!d) return []
  if (entry.action === 'user.update') {
    const c = obj(d.changes) ?? {}
    const out: string[] = []
    if ('role' in c && c.role) out.push(`Role → ${str(c.role)}`)
    if ('isActive' in c) out.push(onOff(c.isActive, 'Activated', 'Deactivated'))
    if ('isVerified' in c) out.push(onOff(c.isVerified, 'Verified', 'Unverified'))
    return out
  }
  if (entry.action === 'dispute.resolve') {
    const action = str(d.action)
    const label = action === 'refund' ? 'Refunded buyer' : action === 'release' ? 'Released to seller' : action === 'reject' ? 'Rejected' : action
    const out = [label]
    if (d.amount !== undefined && d.amount !== null) out.push(formatMoney(Number(d.amount), 'ngn'))
    if (d.resolution) out.push(`“${str(d.resolution).slice(0, 80)}${str(d.resolution).length > 80 ? '…' : ''}”`)
    return out.filter(Boolean)
  }
  if (entry.action === 'settings.update') {
    const out: string[] = []
    const m = obj(d.maintenance)
    if (m) out.push(onOff(m.enabled, 'Maintenance on', 'Maintenance off'))
    const a = obj(d.announcement)
    if (a) out.push(a.enabled ? `Announcement live (${str(a.tone) || 'info'})` : 'Announcement hidden')
    if ('ordersPaused' in d) out.push(onOff(d.ordersPaused, 'Orders paused', 'Orders resumed'))
    if ('signupsPaused' in d) out.push(onOff(d.signupsPaused, 'Sign-ups paused', 'Sign-ups reopened'))
    if ('defaultDeliveryFee' in d) out.push(`Delivery fee ${formatMoney(Number(d.defaultDeliveryFee), 'ngn')}`)
    if ('courierMaxActiveJobs' in d) out.push(`Max courier jobs ${str(d.courierMaxActiveJobs)}`)
    return out
  }
  return []
}

interface AuditLogProps {
  /** Bump to reload (e.g. after the admin saves settings). */
  refreshSignal?: number
}

function AuditLog({ refreshSignal = 0 }: AuditLogProps) {
  const [manualKey, setManualKey] = useState(0)
  const reloadKey = `${manualKey}:${refreshSignal}`
  const [result, setResult] = useState<{ key: string; data: AuditResponse; at: number } | null>(null)
  const [error, setError] = useState<{ key: string; message: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    adminSettingsApi.audit(50)
      .then((data: AuditResponse | null) => {
        if (cancelled) return
        setResult({ key: reloadKey, data: { available: data?.available !== false, entries: data?.entries ?? [] }, at: Date.now() })
      })
      .catch((err: unknown) => {
        if (!cancelled) setError({ key: reloadKey, message: errorMessage(err, "Couldn't load the audit log.") })
      })
    return () => { cancelled = true }
  }, [reloadKey])

  const loading = result?.key !== reloadKey && error?.key !== reloadKey
  const loadError = error?.key === reloadKey ? error.message : null
  const data = result?.data
  const refresh = () => setManualKey((k) => k + 1)

  return (
    <Section
      id='settings-audit'
      title='Audit log'
      subtitle='Recent admin actions, newest first.'
      icon={ScrollText}
      actions={
        <button type='button' onClick={refresh} disabled={loading} className={btnSecondary}>
          {loading ? <Loader2 size={16} className='animate-spin' /> : <RefreshCw size={16} />}Refresh
        </button>
      }
    >
      {loadError && !data ? (
        <LoadError message={loadError} onRetry={refresh} />
      ) : !data ? (
        <SkeletonRows rows={4} label='Loading audit log' />
      ) : !data.available ? (
        <SetupNotice />
      ) : data.entries.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-2 rounded-2xl bg-cream/60 px-6 py-10 text-center'>
          <span className='flex h-11 w-11 items-center justify-center rounded-xl bg-white text-ink'><ScrollText size={20} /></span>
          <p className='font-bold text-ink'>No admin actions yet</p>
          <p className='max-w-sm text-sm text-black/55'>User changes, dispute decisions and settings updates will show up here.</p>
        </div>
      ) : (
        <>
          {loadError && <p role='alert' className='text-sm font-medium text-red-700'>{loadError} Showing the last result.</p>}
          <ul className={`flex flex-col divide-y divide-black/5 rounded-2xl ring-1 ring-black/5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {data.entries.map((entry) => {
              const meta = actionMeta(entry.action)
              const Icon = meta.icon
              const bits = summary(entry)
              return (
                <li key={entry.id} className='flex items-start gap-3 p-3 sm:p-4'>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}><Icon size={16} /></span>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3'>
                      <p className='min-w-0 text-sm text-ink'>
                        <span className='font-bold'>{entry.admin?.name || entry.admin?.email || 'An admin'}</span>
                        <span className='text-black/60'> · {meta.label}</span>
                        <span className='text-black/60'> · </span>
                        <span className='break-all font-semibold'>{target(entry)}</span>
                      </p>
                      <time dateTime={entry.createdAt} title={new Date(entry.createdAt).toLocaleString('en-NG')} className='shrink-0 font-space text-xs text-black/45'>
                        {relativeTime(entry.createdAt, result?.at)}
                      </time>
                    </div>
                    {bits.length > 0 && (
                      <div className='mt-1.5 flex flex-wrap gap-1.5'>
                        {bits.map((b, i) => <span key={i} className='max-w-full break-words rounded-full bg-cream px-2.5 py-0.5 text-xs font-medium text-black/70'>{b}</span>)}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Section>
  )
}

export default AuditLog
