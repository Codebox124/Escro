"use client"
import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageSquare, Phone, X } from '@/components/icons'
import { formatMoney } from '@/lib/money'
import { formatClock, formatDate } from '@/components/ui/chat/chat'
import { ChatAvatar } from '@/components/ui/chat/ChatParts'
import { alertAnimation } from '../Animations'
import { btnGhostIcon, monoLabel } from '../ui'
import { ACTION_ICON, ServiceThumb, actionBtnClass, ghostBtnClass } from './Projs'
import { ACTION_LABEL, TRANSITIONS, requestPill, statusLabel, type ServiceRequest, type Transition } from './types'

interface Props {
  request: ServiceRequest
  busy: boolean
  onClose: () => void
  onAction: (r: ServiceRequest, t: Transition) => void
  onMessage: (r: ServiceRequest) => void
  /** True while a dialog is open on top (Escape then belongs to that dialog). */
  blocked?: boolean
}

const PRICE_SUFFIX: Record<string, string> = { hourly: '/hr', starting_at: ' (starting at)' }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex min-w-0 flex-col gap-0.5 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4'>
      <dt className={monoLabel}>{label}</dt>
      <dd className='min-w-0 wrap-break-word text-sm font-semibold text-ink sm:text-right'>{children}</dd>
    </div>
  )
}

function RequestDetails({ request: r, busy, onClose, onAction, onMessage, blocked = false }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const transitions = TRANSITIONS[r.status] ?? []
  const currency = r.service?.currency
  const phone = r.contactPhone || r.customer?.phone

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    if (blocked) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, blocked])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className='fixed inset-0 z-50 flex justify-end bg-ink/50 font-mont backdrop-blur-sm'
    >
      <motion.aside
        role='dialog'
        aria-modal='true'
        aria-labelledby='request-details-title'
        initial={alertAnimation.initial}
        animate={alertAnimation.animate}
        exit={alertAnimation.initial}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className='flex h-full w-full max-w-lg flex-col bg-white shadow-2xl'
      >
        <header className='flex items-center justify-between gap-3 border-b border-black/5 p-4 sm:p-5'>
          <div className='min-w-0'>
            <p className='eyebrow font-space text-emerald-700'>Project</p>
            <h2 id='request-details-title' className='truncate text-xl font-extrabold tracking-[-0.02em] text-ink'>
              Request details
            </h2>
          </div>
          <button ref={closeRef} type='button' onClick={onClose} aria-label='Close details' className={btnGhostIcon}>
            <X className='h-5 w-5' />
          </button>
        </header>

        <div className='min-h-0 flex-1 overflow-y-auto p-4 sm:p-5'>
          <div className='flex min-w-0 items-start gap-3'>
            <ServiceThumb src={r.service?.image} alt={r.service?.title ?? 'Service'} className='h-16 w-16' />
            <div className='min-w-0 flex-1'>
              <h3 className='wrap-break-word text-lg font-extrabold leading-snug text-ink'>{r.service?.title ?? 'Service unavailable'}</h3>
              {r.service && (
                <p className='mt-0.5 text-sm text-black/55'>
                  Listed at <span className='font-space font-bold text-ink'>{formatMoney(r.service.price, currency)}</span>
                  {PRICE_SUFFIX[r.service.priceType] ?? ''}
                </p>
              )}
              <span className={`${requestPill(r.status)} mt-2`}>{statusLabel(r.status)}</span>
            </div>
          </div>

          <section className='mt-5 rounded-3xl bg-cream p-4'>
            <p className={monoLabel}>Customer</p>
            <div className='mt-2 flex min-w-0 items-center gap-3'>
              <ChatAvatar name={r.customer?.name} avatar={r.customer?.avatar} className='h-11 w-11 text-sm' />
              <p className='min-w-0 truncate font-bold text-ink'>{r.customer?.name || 'Customer'}</p>
            </div>
            <div className='mt-3 flex flex-col gap-1.5 text-sm'>
              {r.customer?.email && (
                <a href={`mailto:${r.customer.email}`} className='inline-flex min-w-0 items-center gap-2 text-ink hover:underline'>
                  <Mail className='h-4 w-4 shrink-0 text-black/50' aria-hidden='true' />
                  <span className='truncate'>{r.customer.email}</span>
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className='inline-flex items-center gap-2 text-ink hover:underline'>
                  <Phone className='h-4 w-4 shrink-0 text-black/50' aria-hidden='true' />
                  {phone}
                </a>
              )}
            </div>
          </section>

          <section className='mt-5'>
            <p className={monoLabel}>Request message</p>
            <p className='mt-2 whitespace-pre-line wrap-break-word rounded-2xl bg-white p-4 text-sm leading-relaxed text-ink ring-1 ring-black/5'>
              {r.message}
            </p>
          </section>

          <dl className='mt-5 divide-y divide-black/5'>
            <Row label='Budget'>{r.budget != null && r.budget > 0 ? formatMoney(r.budget, currency) : 'Not set'}</Row>
            <Row label='Preferred date'>{r.preferredDate ? formatDate(r.preferredDate) : 'Flexible'}</Row>
            <Row label='Received'>{formatDate(r.createdAt)} · {formatClock(r.createdAt)}</Row>
            <Row label='Last updated'>{formatDate(r.updatedAt)} · {formatClock(r.updatedAt)}</Row>
          </dl>

          {r.providerNote && (
            <section className='mt-5'>
              <p className={monoLabel}>Your note to the customer</p>
              <p className='mt-2 whitespace-pre-line wrap-break-word rounded-2xl bg-cream p-4 text-sm text-ink'>{r.providerNote}</p>
            </section>
          )}
        </div>

        <footer className='flex flex-wrap gap-2 border-t border-black/5 p-4 sm:p-5'>
          {transitions.map((t) => {
            const Icon = ACTION_ICON[t]
            return (
              <button key={t} type='button' disabled={busy} onClick={() => onAction(r, t)} className={actionBtnClass[t]}>
                <Icon className='h-4 w-4' aria-hidden='true' />
                {ACTION_LABEL[t]}
              </button>
            )
          })}
          <button type='button' onClick={() => onMessage(r)} className={`${ghostBtnClass} ml-auto`}>
            <MessageSquare className='h-4 w-4' aria-hidden='true' />
            Message customer
          </button>
        </footer>
      </motion.aside>
    </motion.div>
  )
}

export default RequestDetails
