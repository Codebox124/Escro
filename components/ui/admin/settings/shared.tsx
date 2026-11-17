"use client"
import React, { ReactNode, useState } from 'react'
import { motion } from 'framer-motion'
import { CircleAlert, DatabaseZap, Loader2, RefreshCw, X } from '@/components/icons'
import { btnDanger, btnPrimary, btnSecondary, cardSubtitle, cardTitle, iconTile } from '../ui'
import { SETUP_NOTICE } from './types'

interface SectionProps {
  id?: string
  title: string
  subtitle?: string
  icon: React.ElementType
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function Section({ id, title, subtitle, icon: Icon, actions, children, className = '' }: SectionProps) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={`surface-card flex min-w-0 flex-col gap-5 p-5 sm:p-6 ${className}`}>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex min-w-0 items-start gap-3'>
          <span className={iconTile}><Icon size={18} /></span>
          <div className='min-w-0'>
            <h2 id={id ? `${id}-title` : undefined} className={cardTitle}>{title}</h2>
            {subtitle && <p className={cardSubtitle}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div className='flex flex-wrap items-center gap-2 sm:shrink-0'>{actions}</div>}
      </div>
      {children}
    </section>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  busy?: boolean
  label: string
}

export function Toggle({ checked, onChange, disabled, busy, label }: ToggleProps) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-ink' : 'bg-black/15'}`}
    >
      <span className={`flex h-5 w-5 items-center justify-center rounded-full shadow transition-transform ${checked ? 'translate-x-6 bg-lime text-ink' : 'translate-x-1 bg-white text-black/40'}`}>
        {busy && <Loader2 size={12} className='animate-spin' />}
      </span>
    </button>
  )
}

export function StatePill({ on, onLabel = 'On', offLabel = 'Off', tone = 'amber' }: { on: boolean; onLabel?: string; offLabel?: string; tone?: 'amber' | 'emerald' | 'red' }) {
  const onCls = tone === 'emerald' ? 'bg-emerald-100 text-emerald-800' : tone === 'red' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${on ? onCls : 'bg-cream text-black/60'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${on ? 'bg-current' : 'bg-black/30'}`} />
      {on ? onLabel : offLabel}
    </span>
  )
}

export function SetupNotice({ className = '' }: { className?: string }) {
  return (
    <div role='note' className={`flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200 ${className}`}>
      <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700'><DatabaseZap size={16} /></span>
      <p className='min-w-0 break-words font-medium leading-snug'>{SETUP_NOTICE}</p>
    </div>
  )
}

export function InlineError({ message, className = '' }: { message: string; className?: string }) {
  return (
    <div role='alert' className={`flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700 ring-1 ring-red-200 ${className}`}>
      <CircleAlert size={16} className='mt-0.5 shrink-0' />
      <span className='min-w-0 break-words'>{message}</span>
    </div>
  )
}

export function LoadError({ message, onRetry, className = '' }: { message: string; onRetry: () => void; className?: string }) {
  return (
    <div role='alert' className={`flex flex-col items-center justify-center gap-3 rounded-2xl bg-cream/60 px-6 py-10 text-center ${className}`}>
      <span className='flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600'><CircleAlert size={20} /></span>
      <p className='max-w-md text-sm font-medium text-black/70'>{message}</p>
      <button type='button' onClick={onRetry} className={btnSecondary}><RefreshCw size={16} />Try again</button>
    </div>
  )
}

export function SkeletonRows({ rows = 3, label }: { rows?: number; label: string }) {
  return (
    <div className='flex flex-col gap-3' aria-busy='true' aria-label={label}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className='flex items-center gap-3 rounded-2xl bg-cream/50 p-4'>
          <span className='h-9 w-9 shrink-0 animate-pulse rounded-xl bg-black/10' />
          <div className='flex min-w-0 flex-1 flex-col gap-2'>
            <span className='h-3.5 w-40 max-w-full animate-pulse rounded bg-black/10' />
            <span className='h-3 w-64 max-w-full animate-pulse rounded bg-black/5' />
          </div>
          <span className='h-7 w-12 shrink-0 animate-pulse rounded-full bg-black/10' />
        </div>
      ))}
    </div>
  )
}

export interface ConfirmCopy {
  title: string
  body: ReactNode
  cta: string
  icon: React.ElementType
  danger?: boolean
}

interface ConfirmDialogProps {
  copy: ConfirmCopy
  onCancel: () => void
  /** Resolves on success; rejects with an Error whose message is shown inline. */
  onConfirm: () => Promise<void>
}

export function ConfirmDialog({ copy, onCancel, onConfirm }: ConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const Icon = copy.icon

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => !submitting && onCancel()}
      className='fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-0 font-mont backdrop-blur-sm sm:items-center sm:p-4'
    >
      <motion.div
        role='alertdialog'
        aria-modal='true'
        aria-labelledby='settings-confirm-title'
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className='flex max-h-[90dvh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white shadow-[0_40px_80px_-30px_rgba(12,17,14,0.5)] ring-1 ring-black/5 sm:max-w-md sm:rounded-3xl'
      >
        <div className='flex items-start gap-3 p-5 sm:p-6'>
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${copy.danger ? 'bg-amber-50 text-amber-700' : 'bg-cream text-ink'}`}><Icon size={20} /></span>
          <div className='min-w-0 flex-1'>
            <h2 id='settings-confirm-title' className='text-lg font-extrabold tracking-[-0.02em] text-ink'>{copy.title}</h2>
            <div className='mt-1 text-sm text-black/60'>{copy.body}</div>
          </div>
          <button type='button' aria-label='Close' disabled={submitting} onClick={onCancel} className='inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-black/50 hover:bg-cream hover:text-ink'><X size={16} /></button>
        </div>
        {error && <InlineError message={error} className='mx-5 sm:mx-6' />}
        <div className='mt-5 flex flex-col-reverse gap-2 border-t border-black/5 bg-cream/50 p-4 sm:flex-row sm:justify-end sm:px-6'>
          <button type='button' disabled={submitting} onClick={onCancel} className={btnSecondary}>Cancel</button>
          <button type='button' disabled={submitting} onClick={submit} className={copy.danger ? btnDanger : btnPrimary}>
            {submitting && <Loader2 size={16} className='animate-spin' />}{copy.cta}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
