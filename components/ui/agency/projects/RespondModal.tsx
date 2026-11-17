"use client"
import React, { useEffect, useRef, useState } from 'react'
import { Loader2, X } from '@/components/icons'
import { btnDanger, btnPrimary, btnSecondary, btnGhostIcon, inputBase, modalOverlay, modalPanel } from '../ui'
import { ACTION_LABEL, type ServiceRequest, type Transition } from './types'

const COPY: Record<Transition, { title: string; text: string; placeholder: string }> = {
  accepted: {
    title: 'Accept this request?',
    text: 'The customer will see the request as in progress. Add a note with next steps if you like.',
    placeholder: 'e.g. Thanks! We can start on Monday — expect a call from our team.',
  },
  declined: {
    title: 'Decline this request?',
    text: "The customer will be told you can't take this on, and the conversation will be closed.",
    placeholder: "e.g. Sorry, we're fully booked for that date.",
  },
  completed: {
    title: 'Mark as completed?',
    text: 'Let the customer know the work is done.',
    placeholder: 'e.g. All done — thanks for choosing us!',
  },
}

interface Props {
  request: ServiceRequest
  transition: Transition
  busy: boolean
  error: string | null
  onClose: () => void
  onConfirm: (note: string) => void
}

function RespondModal({ request, transition, busy, error, onClose, onConfirm }: Props) {
  const [note, setNote] = useState(request.providerNote ?? '')
  const ref = useRef<HTMLTextAreaElement>(null)
  const copy = COPY[transition]

  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const confirmCls = transition === 'declined' ? btnDanger : btnPrimary

  return (
    <div className={`${modalOverlay} font-mont`} onClick={() => !busy && onClose()}>
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='respond-title'
        className={modalPanel}
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onConfirm(note)
          }}
          className='flex flex-col gap-4 p-5 sm:p-6'
        >
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h2 id='respond-title' className='text-xl font-extrabold tracking-[-0.02em] text-ink'>{copy.title}</h2>
              <p className='mt-1 text-sm text-black/55'>
                <span className='font-semibold text-ink'>{request.service?.title ?? 'Service'}</span>
                {request.customer?.name ? <> · {request.customer.name}</> : null}
              </p>
            </div>
            <button type='button' onClick={onClose} disabled={busy} aria-label='Close' className={btnGhostIcon}>
              <X className='h-5 w-5' />
            </button>
          </div>
          <p className='text-sm text-black/60'>{copy.text}</p>
          <div>
            <label htmlFor='respond-note' className='mb-1.5 block text-sm font-bold text-ink'>
              Note to customer <span className='font-normal text-black/45'>(optional)</span>
            </label>
            <textarea
              id='respond-note'
              ref={ref}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder={copy.placeholder}
              className={`${inputBase} h-auto resize-y py-3`}
            />
            <p className='mt-1 text-right font-space text-[11px] text-black/40'>{note.length}/1000</p>
          </div>
          {error && <p role='alert' className='rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700'>{error}</p>}
          <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <button type='button' onClick={onClose} disabled={busy} className={btnSecondary}>Cancel</button>
            <button type='submit' disabled={busy} className={confirmCls}>
              {busy && <Loader2 className='h-4 w-4 animate-spin' />}
              {ACTION_LABEL[transition]}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RespondModal
