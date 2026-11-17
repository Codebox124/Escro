"use client"
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Ban, CircleAlert, CircleCheck, Loader2, UserLock, X } from '@/components/icons'
import { btnDanger, btnPrimary, btnSecondary, inputBase, monoLabel } from '../ui'
import { AdminUser, PendingUserAction, ROLES, ROLE_META, UserRole, roleMeta } from './types'

interface ConfirmUserActionProps {
  action: PendingUserAction
  onCancel: () => void
  /** Resolves on success; rejects with a message to show inline. */
  onConfirm: (patch: Partial<Pick<AdminUser, "isActive" | "isVerified">> & { role?: UserRole }) => Promise<void>
}

function ConfirmUserAction({ action, onCancel, onConfirm }: ConfirmUserActionProps) {
  const { user, kind } = action
  const currentRole = (user.role || "").toLowerCase() as UserRole
  const [role, setRole] = useState<UserRole>(currentRole)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const copy = {
    deactivate: {
      title: `Deactivate ${user.name}?`,
      body: "They will be signed out and won't be able to log in or use Escro until the account is activated again.",
      cta: "Deactivate",
      icon: Ban,
      tone: "bg-red-50 text-red-600",
    },
    activate: {
      title: `Activate ${user.name}?`,
      body: "They'll be able to sign in and use Escro again straight away.",
      cta: "Activate",
      icon: CircleCheck,
      tone: "bg-emerald-50 text-emerald-700",
    },
    role: {
      title: `Change role for ${user.name}`,
      body: "Changing a role changes which dashboard and permissions this account gets the next time they sign in.",
      cta: "Change role",
      icon: UserLock,
      tone: "bg-cream text-ink",
    },
  }[kind]
  const Icon = copy.icon
  const unchanged = kind === "role" && role === currentRole

  async function submit() {
    if (unchanged || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm(kind === "role" ? { role } : { isActive: kind === "activate" })
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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-user-title"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className='flex max-h-[90dvh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white shadow-[0_40px_80px_-30px_rgba(12,17,14,0.5)] ring-1 ring-black/5 sm:max-w-md sm:rounded-3xl'
      >
        <div className='flex items-start gap-3 p-5 sm:p-6'>
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${copy.tone}`}><Icon size={20} /></span>
          <div className='min-w-0 flex-1'>
            <h2 id="confirm-user-title" className='text-lg font-extrabold tracking-[-0.02em] text-ink'>{copy.title}</h2>
            <p className='mt-1 text-sm text-black/60'>{copy.body}</p>
          </div>
          <button type='button' aria-label='Close' disabled={submitting} onClick={onCancel} className='inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-black/50 hover:bg-cream hover:text-ink'><X size={16} /></button>
        </div>

        {kind === "role" && (
          <div className='flex flex-col gap-2 px-5 sm:px-6'>
            <label htmlFor="user-role-select" className={monoLabel}>New role (currently {roleMeta(user.role).label})</label>
            <select
              id="user-role-select"
              value={role}
              disabled={submitting}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className={`${inputBase} cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%230C110E' stroke-width='3'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10`}
            >
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
            </select>
          </div>
        )}

        {error && (
          <div role="alert" className='mx-5 mt-4 flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700 ring-1 ring-red-200 sm:mx-6'>
            <CircleAlert size={16} className='mt-0.5 shrink-0' />{error}
          </div>
        )}

        <div className='mt-5 flex flex-col-reverse gap-2 border-t border-black/5 bg-cream/50 p-4 sm:flex-row sm:justify-end sm:px-6'>
          <button type='button' disabled={submitting} onClick={onCancel} className={btnSecondary}>Cancel</button>
          <button type='button' disabled={submitting || unchanged} onClick={submit} className={kind === "deactivate" ? btnDanger : btnPrimary}>
            {submitting && <Loader2 size={16} className='animate-spin' />}{copy.cta}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ConfirmUserAction
