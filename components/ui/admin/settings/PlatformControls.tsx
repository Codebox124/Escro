"use client"
import React, { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Construction, Loader2, Power, ShoppingCart, UserPlus } from '@/components/icons'
import { btnSecondary, inputBase, monoLabel } from '../ui'
import { ConfirmCopy, ConfirmDialog, InlineError, Section, SetupNotice, StatePill, Toggle } from './shared'
import { MAX_MAINTENANCE_MESSAGE, PlatformSettings, SettingsPatch } from './types'

type ControlKey = 'maintenance' | 'ordersPaused' | 'signupsPaused'

interface PlatformControlsProps {
  settings: PlatformSettings
  available: boolean
  /** Persists a partial update; rejects with an Error carrying the backend message. */
  onSave: (patch: SettingsPatch, successMessage: string) => Promise<void>
}

const CONFIRM: Record<ControlKey, ConfirmCopy> = {
  maintenance: {
    title: 'Turn on maintenance mode?',
    body: 'Everyone except admins will be blocked from making changes — no orders, sign-ups, store edits or deliveries updates. The site stays browsable and shows your maintenance message.',
    cta: 'Turn on maintenance',
    icon: Construction,
    danger: true,
  },
  ordersPaused: {
    title: 'Pause new orders?',
    body: 'Buyers won’t be able to check out until you resume orders. Their carts are kept, and orders already placed carry on as normal.',
    cta: 'Pause orders',
    icon: ShoppingCart,
  },
  signupsPaused: {
    title: 'Pause new sign-ups?',
    body: 'New accounts can’t be registered until you turn this off. Existing users can still sign in.',
    cta: 'Pause sign-ups',
    icon: UserPlus,
  },
}

const ROW_COPY: Record<ControlKey, { title: string; description: string; icon: React.ElementType; onLabel: string; offLabel: string }> = {
  maintenance: {
    title: 'Maintenance mode',
    description: 'Blocks all changes for non-admins; the site stays browsable. Users see the message below.',
    icon: Construction,
    onLabel: 'Maintenance on',
    offLabel: 'Off',
  },
  ordersPaused: {
    title: 'Pause new orders',
    description: 'Checkout is blocked; carts are kept. Existing orders and deliveries continue.',
    icon: ShoppingCart,
    onLabel: 'Orders paused',
    offLabel: 'Accepting orders',
  },
  signupsPaused: {
    title: 'Pause new sign-ups',
    description: 'Registration is blocked. Existing accounts can still sign in.',
    icon: UserPlus,
    onLabel: 'Sign-ups paused',
    offLabel: 'Open',
  },
}

function MaintenanceMessage({ settings, available, onSave }: PlatformControlsProps) {
  const initial = settings.maintenance.message
  const [message, setMessage] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const trimmed = message.trim()
  const dirty = trimmed !== initial.trim()

  async function save() {
    if (!dirty || saving) return
    if (!trimmed) { setError('Write a short message for users, or keep the default.'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave({ maintenance: { enabled: settings.maintenance.enabled, message: trimmed } }, 'Maintenance message saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between gap-2'>
        <label htmlFor='maintenance-message' className={monoLabel}>Message shown to users</label>
        <span className='font-space text-[11px] text-black/45'>{message.length}/{MAX_MAINTENANCE_MESSAGE}</span>
      </div>
      <textarea
        id='maintenance-message'
        rows={2}
        maxLength={MAX_MAINTENANCE_MESSAGE}
        value={message}
        disabled={!available || saving}
        onChange={(e) => setMessage(e.target.value)}
        className={`${inputBase} h-auto resize-y py-3 leading-snug disabled:cursor-not-allowed disabled:opacity-60`}
      />
      {error && <InlineError message={error} />}
      {dirty && (
        <div className='flex flex-wrap justify-end gap-2'>
          <button type='button' disabled={saving} onClick={() => { setMessage(initial); setError(null) }} className={`${btnSecondary} h-9 px-4 text-xs`}>Discard</button>
          <button type='button' disabled={!available || saving} onClick={save} className={`${btnSecondary} h-9 border-ink px-4 text-xs`}>
            {saving && <Loader2 size={14} className='animate-spin' />}Save message
          </button>
        </div>
      )}
    </div>
  )
}

function PlatformControls({ settings, available, onSave }: PlatformControlsProps) {
  const [confirming, setConfirming] = useState<ControlKey | null>(null)
  const [busy, setBusy] = useState<ControlKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  const values: Record<ControlKey, boolean> = {
    maintenance: settings.maintenance.enabled,
    ordersPaused: settings.ordersPaused,
    signupsPaused: settings.signupsPaused,
  }

  function patchFor(key: ControlKey, next: boolean): SettingsPatch {
    if (key === 'maintenance') return { maintenance: { enabled: next, message: settings.maintenance.message } }
    return { [key]: next }
  }

  function successFor(key: ControlKey, next: boolean) {
    if (key === 'maintenance') return next ? 'Maintenance mode is on' : 'Maintenance mode is off'
    if (key === 'ordersPaused') return next ? 'New orders paused' : 'Orders resumed'
    return next ? 'Sign-ups paused' : 'Sign-ups reopened'
  }

  async function apply(key: ControlKey, next: boolean) {
    await onSave(patchFor(key, next), successFor(key, next))
  }

  async function toggle(key: ControlKey, next: boolean) {
    setError(null)
    if (next) { setConfirming(key); return }
    setBusy(key)
    try {
      await apply(key, false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  const anyOn = values.maintenance || values.ordersPaused || values.signupsPaused

  return (
    <Section
      id='settings-controls'
      title='Platform controls'
      subtitle='Switches that change what users can do right now. They take effect immediately.'
      icon={Power}
      actions={
        <div className='flex flex-wrap gap-1.5'>
          {!anyOn && <StatePill on onLabel='Running normally' tone='emerald' />}
          {values.maintenance && <StatePill on onLabel='Maintenance' tone='red' />}
          {values.ordersPaused && <StatePill on onLabel='Orders paused' />}
          {values.signupsPaused && <StatePill on onLabel='Sign-ups paused' />}
        </div>
      }
    >
      {!available && <SetupNotice />}
      {error && <InlineError message={error} />}
      <ul className='flex flex-col divide-y divide-black/5 rounded-2xl ring-1 ring-black/5'>
        {(Object.keys(ROW_COPY) as ControlKey[]).map((key) => {
          const row = ROW_COPY[key]
          const Icon = row.icon
          const on = values[key]
          return (
            <li key={key} className='flex flex-col gap-4 p-4 sm:p-5'>
              <div className='flex items-start gap-3'>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${on ? 'bg-amber-100 text-amber-700' : 'bg-cream text-ink'}`}><Icon size={18} /></span>
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='font-bold text-ink'>{row.title}</p>
                    <StatePill on={on} onLabel={row.onLabel} offLabel={row.offLabel} tone={key === 'maintenance' ? 'red' : 'amber'} />
                  </div>
                  <p className='mt-1 text-sm text-black/55'>{row.description}</p>
                </div>
                <Toggle
                  label={row.title}
                  checked={on}
                  disabled={!available || (busy !== null && busy !== key)}
                  busy={busy === key}
                  onChange={(next) => toggle(key, next)}
                />
              </div>
              {key === 'maintenance' && (
                <div className='sm:pl-13'>
                  <MaintenanceMessage key={settings.maintenance.message} settings={settings} available={available} onSave={onSave} />
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <AnimatePresence>
        {confirming && (
          <ConfirmDialog
            key='confirm-control'
            copy={confirming === 'maintenance'
              ? { ...CONFIRM.maintenance, body: <>{CONFIRM.maintenance.body}<span className='mt-3 block rounded-xl bg-cream p-3 text-ink'>“{settings.maintenance.message}”</span></> }
              : CONFIRM[confirming]}
            onCancel={() => setConfirming(null)}
            onConfirm={async () => {
              await apply(confirming, true)
              setConfirming(null)
            }}
          />
        )}
      </AnimatePresence>
    </Section>
  )
}

export default PlatformControls
