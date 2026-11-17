"use client"
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CircleAlert, Gavel, Loader2, X } from '@/components/icons'
import { formatMoney } from '@/lib/money'
import { btnDanger, btnPrimary, btnSecondary, inputBase, monoLabel } from '../ui'
import { AdminDispute, RESOLVE_OPTIONS, ResolveAction } from './types'

interface ResolveDialogProps {
  dispute: AdminDispute
  onCancel: () => void
  /** Rejects with an Error whose message is shown inline. */
  onConfirm: (action: ResolveAction, resolution: string) => Promise<void>
}

const MIN_NOTE = 5

function ResolveDialog({ dispute, onCancel, onConfirm }: ResolveDialogProps) {
  const [action, setAction] = useState<ResolveAction | null>(null)
  const [note, setNote] = useState("")
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const noteOk = note.trim().length >= MIN_NOTE
  const canSubmit = Boolean(action) && noteOk && !submitting

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!action || !noteOk || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm(action, note.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  const orderNo = dispute.order?.orderNumber ?? dispute.order?.id ?? "order"

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => !submitting && onCancel()}
      className='fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-0 font-mont backdrop-blur-sm sm:items-center sm:p-4'
    >
      <motion.form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resolve-title"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className='flex max-h-[90dvh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white shadow-[0_40px_80px_-30px_rgba(12,17,14,0.5)] ring-1 ring-black/5 sm:max-w-lg sm:rounded-3xl'
      >
        <div className='flex items-start gap-3 border-b border-black/5 p-5 sm:p-6'>
          <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700'><Gavel size={20} /></span>
          <div className='min-w-0 flex-1'>
            <h2 id="resolve-title" className='text-lg font-extrabold tracking-[-0.02em] text-ink'>Resolve dispute</h2>
            <p className='mt-0.5 truncate text-sm text-black/55'>
              Order <span className='font-space font-bold text-ink'>#{orderNo}</span> · {formatMoney(dispute.order?.total ?? dispute.escrow?.amount ?? 0, "ngn")}
            </p>
          </div>
          <button type='button' aria-label='Close' disabled={submitting} onClick={onCancel} className='inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-black/50 hover:bg-cream hover:text-ink'><X size={16} /></button>
        </div>

        <fieldset className='flex flex-col gap-2 p-5 sm:px-6' disabled={submitting}>
          <legend className={`${monoLabel} mb-2`}>Outcome</legend>
          {RESOLVE_OPTIONS.map((o) => {
            const checked = action === o.value
            return (
              <label
                key={o.value}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl p-4 ring-1 transition-colors ${checked ? (o.value === "reject" ? "bg-black/[0.03] ring-2 ring-ink" : "bg-lime/25 ring-2 ring-ink") : "ring-black/10 hover:bg-cream/60"}`}
              >
                <input
                  type="radio"
                  name="resolve-action"
                  value={o.value}
                  checked={checked}
                  onChange={() => setAction(o.value)}
                  className='mt-1 h-4 w-4 shrink-0 accent-[#0C110E]'
                />
                <span className='min-w-0'>
                  <span className='block font-bold text-ink'>{o.label}</span>
                  <span className='mt-0.5 block text-sm text-black/60'>{o.help}</span>
                </span>
              </label>
            )
          })}
          {touched && !action && <p className='text-sm font-medium text-red-600'>Choose an outcome.</p>}

          <label htmlFor="resolution-note" className={`${monoLabel} mt-3`}>Resolution note (shared with both parties)</label>
          <textarea
            id="resolution-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => setTouched(true)}
            rows={4}
            placeholder="e.g. Courier confirmed the parcel was never delivered — refunding the buyer."
            aria-invalid={touched && !noteOk}
            className={`${inputBase} h-auto resize-y py-3 leading-relaxed ${touched && !noteOk ? "ring-red-400" : ""}`}
          />
          <p className={`text-xs ${touched && !noteOk ? "font-medium text-red-600" : "text-black/45"}`}>
            {touched && !noteOk ? `Write at least ${MIN_NOTE} characters.` : `Minimum ${MIN_NOTE} characters.`}
          </p>
        </fieldset>

        {error && (
          <div role="alert" className='mx-5 flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700 ring-1 ring-red-200 sm:mx-6'>
            <CircleAlert size={16} className='mt-0.5 shrink-0' />{error}
          </div>
        )}

        <div className='mt-4 flex flex-col-reverse gap-2 border-t border-black/5 bg-cream/50 p-4 sm:flex-row sm:justify-end sm:px-6'>
          <button type='button' disabled={submitting} onClick={onCancel} className={btnSecondary}>Cancel</button>
          <button type='submit' disabled={!canSubmit && touched} className={action === "reject" ? btnDanger : btnPrimary}>
            {submitting && <Loader2 size={16} className='animate-spin' />}
            {action ? RESOLVE_OPTIONS.find((o) => o.value === action)?.label : "Confirm"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  )
}

export default ResolveDialog
