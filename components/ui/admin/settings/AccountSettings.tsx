"use client"
import React, { useMemo, useState, useSyncExternalStore } from 'react'
import { CircleCheck, Eye, EyeOff, KeyRound, Loader2, Mail, UserRound } from '@/components/icons'
import { authService } from '@/services/auth'
import { btnPrimary, inputBase, monoLabel } from '../ui'
import { errorMessage } from '../users/types'
import { InlineError, Section } from './shared'

interface StoredUser {
  full_name?: string
  name?: string
  email?: string
  role?: string
}

// Read the signed-in user from localStorage without a hydration mismatch.
const subscribe = (cb: () => void) => {
  window.addEventListener('storage', cb)
  return () => window.removeEventListener('storage', cb)
}
const getSnapshot = () => {
  try { return localStorage.getItem('user') } catch { return null }
}
const getServerSnapshot = () => null

function PasswordInput({ id, label, value, onChange, autoComplete, disabled, hint, invalid }: {
  id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string; disabled?: boolean; hint?: string; invalid?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className='flex flex-col gap-2'>
      <label htmlFor={id} className={monoLabel}>{label}</label>
      <div className='relative'>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputBase} pr-12 disabled:opacity-60 ${invalid ? 'ring-red-300' : ''}`}
        />
        <button
          type='button'
          aria-label={show ? 'Hide password' : 'Show password'}
          onClick={() => setShow((s) => !s)}
          className='absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-black/45 hover:bg-cream hover:text-ink'
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {hint && <p id={`${id}-hint`} className={`text-xs ${invalid ? 'font-medium text-red-700' : 'text-black/50'}`}>{hint}</p>}
    </div>
  )
}

function AccountSettings() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const user = useMemo<StoredUser | null>(() => {
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return authService.getUser() }
  }, [raw])

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const tooShort = next.length > 0 && next.length < 8
  const mismatch = confirm.length > 0 && confirm !== next
  const sameAsOld = next.length > 0 && next === current
  const canSubmit = current.length > 0 && next.length >= 8 && confirm === next && !sameAsOld && !submitting

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      await authService.updatePassword(current, next)
      setCurrent('')
      setNext('')
      setConfirm('')
      setSuccess(true)
    } catch (err) {
      setError(errorMessage(err, "Couldn't change your password."))
    } finally {
      setSubmitting(false)
    }
  }

  const name = user?.full_name || user?.name || '—'
  const email = user?.email || '—'

  return (
    <Section id='settings-account' title='Your account' subtitle='The admin account you are signed in with.' icon={UserRound}>
      <dl className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div className='flex min-w-0 items-center gap-3 rounded-2xl bg-cream/60 p-4'>
          <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-ink'><UserRound size={16} /></span>
          <div className='min-w-0'>
            <dt className={monoLabel}>Name</dt>
            <dd className='truncate text-sm font-bold text-ink'>{name}</dd>
          </div>
        </div>
        <div className='flex min-w-0 items-center gap-3 rounded-2xl bg-cream/60 p-4'>
          <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-ink'><Mail size={16} /></span>
          <div className='min-w-0'>
            <dt className={monoLabel}>Email</dt>
            <dd className='truncate text-sm font-bold text-ink'>{email}</dd>
          </div>
        </div>
      </dl>

      <form onSubmit={submit} noValidate className='flex flex-col gap-4 border-t border-black/5 pt-5'>
        <div className='flex items-center gap-2'>
          <KeyRound size={16} className='text-black/50' />
          <p className='font-bold text-ink'>Change password</p>
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <PasswordInput id='current-password' label='Current password' autoComplete='current-password' value={current} onChange={(v) => { setCurrent(v); setSuccess(false) }} disabled={submitting} />
          <PasswordInput
            id='new-password'
            label='New password'
            autoComplete='new-password'
            value={next}
            onChange={(v) => { setNext(v); setSuccess(false) }}
            disabled={submitting}
            invalid={tooShort || sameAsOld}
            hint={sameAsOld ? 'Choose a different password from your current one' : 'At least 8 characters'}
          />
          <PasswordInput
            id='confirm-password'
            label='Confirm new password'
            autoComplete='new-password'
            value={confirm}
            onChange={(v) => { setConfirm(v); setSuccess(false) }}
            disabled={submitting}
            invalid={mismatch}
            hint={mismatch ? 'Passwords don’t match' : undefined}
          />
        </div>
        {error && <InlineError message={error} />}
        {success && (
          <div role='status' className='flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200'>
            <CircleCheck size={16} className='shrink-0' />Password changed. Use the new one next time you sign in.
          </div>
        )}
        <div className='flex justify-end'>
          <button type='submit' disabled={!canSubmit} className={`${btnPrimary} w-full sm:w-auto`}>
            {submitting && <Loader2 size={16} className='animate-spin' />}Update password
          </button>
        </div>
      </form>
    </Section>
  )
}

export default AccountSettings
