"use client"
import React, { useState } from 'react'
import { Briefcase, CalendarDays, Check, Clock, Eye, Mail, MessageSquare, Phone, Wallet, X } from '@/components/icons'
import { formatMoney } from '@/lib/money'
import { formatDate } from '@/components/ui/chat/chat'
import { ChatAvatar } from '@/components/ui/chat/ChatParts'
import { ACTION_LABEL, TRANSITIONS, requestPill, statusLabel, type ServiceRequest, type Transition } from './types'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2'
const smallBtn = `inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`

export const actionBtnClass: Record<Transition, string> = {
  accepted: `${smallBtn} bg-ink text-white hover:bg-ink-soft [&_svg]:text-lime`,
  completed: `${smallBtn} bg-lime text-ink hover:bg-lime-dark`,
  declined: `${smallBtn} border-2 border-red-200 bg-white text-red-600 hover:bg-red-50`,
}
export const ghostBtnClass = `${smallBtn} border-2 border-ink/15 text-ink hover:border-ink`

export const ACTION_ICON: Record<Transition, React.ElementType> = {
  accepted: Check,
  completed: Check,
  declined: X,
}

export function ServiceThumb({ src, alt, className = 'h-14 w-14' }: { src?: string | null; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false)
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cream text-ink ${className}`}>
      {src && !broken ? (
        <img src={src} alt={alt} className='h-full w-full object-cover' onError={() => setBroken(true)} />
      ) : (
        <Briefcase className='h-6 w-6 text-black/40' aria-hidden='true' />
      )}
    </div>
  )
}

interface Props {
  requests: ServiceRequest[]
  busyId: string | null
  onOpen: (r: ServiceRequest) => void
  onAction: (r: ServiceRequest, t: Transition) => void
  onMessage: (r: ServiceRequest) => void
}

function Projs({ requests, busyId, onOpen, onAction, onMessage }: Props) {
  return (
    <ul className='grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3'>
      {requests.map((r) => (
        <ProjectCard key={r.id} r={r} busy={busyId === r.id} onOpen={onOpen} onAction={onAction} onMessage={onMessage} />
      ))}
    </ul>
  )
}

function ProjectCard({
  r,
  busy,
  onOpen,
  onAction,
  onMessage,
}: {
  r: ServiceRequest
  busy: boolean
  onOpen: Props['onOpen']
  onAction: Props['onAction']
  onMessage: Props['onMessage']
}) {
  const currency = r.service?.currency
  const transitions = TRANSITIONS[r.status] ?? []
  const customerName = r.customer?.name || 'Customer'
  return (
    <li className='surface-card card-hover flex min-w-0 flex-col gap-4 p-4 sm:p-5'>
      <div className='flex min-w-0 items-start gap-3'>
        <ServiceThumb src={r.service?.image} alt={r.service?.title ?? 'Service'} />
        <div className='min-w-0 flex-1'>
          <div className='flex min-w-0 flex-wrap items-start justify-between gap-2'>
            <button
              type='button'
              onClick={() => onOpen(r)}
              className={`min-w-0 cursor-pointer text-left font-extrabold leading-snug tracking-[-0.01em] text-ink hover:underline ${focusRing} rounded`}
            >
              <span className='line-clamp-2 wrap-break-word'>{r.service?.title ?? 'Service unavailable'}</span>
            </button>
            <span className={requestPill(r.status)}>{statusLabel(r.status)}</span>
          </div>
          <div className='mt-2 flex min-w-0 items-center gap-2'>
            <ChatAvatar name={customerName} avatar={r.customer?.avatar} className='h-7 w-7 text-[10px]' />
            <p className='min-w-0 truncate text-sm font-semibold text-ink'>{customerName}</p>
          </div>
          {(r.customer?.email || r.customer?.phone || r.contactPhone) && (
            <div className='mt-1.5 flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-black/55'>
              {r.customer?.email && (
                <a href={`mailto:${r.customer.email}`} className='inline-flex min-w-0 max-w-full items-center gap-1 hover:text-ink hover:underline'>
                  <Mail className='h-3.5 w-3.5 shrink-0' aria-hidden='true' />
                  <span className='truncate'>{r.customer.email}</span>
                </a>
              )}
              {(r.contactPhone || r.customer?.phone) && (
                <a href={`tel:${r.contactPhone || r.customer?.phone}`} className='inline-flex items-center gap-1 hover:text-ink hover:underline'>
                  <Phone className='h-3.5 w-3.5 shrink-0' aria-hidden='true' />
                  {r.contactPhone || r.customer?.phone}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <p className='line-clamp-3 whitespace-pre-line wrap-break-word text-sm text-black/65'>{r.message}</p>

      <dl className='flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-black/55'>
        <div className='inline-flex items-center gap-1'>
          <Wallet className='h-3.5 w-3.5 shrink-0' aria-hidden='true' />
          <dt>Budget</dt>
          <dd className='font-space font-bold text-ink'>{r.budget != null && r.budget > 0 ? formatMoney(r.budget, currency) : 'Not set'}</dd>
        </div>
        {r.preferredDate && (
          <div className='inline-flex items-center gap-1'>
            <CalendarDays className='h-3.5 w-3.5 shrink-0' aria-hidden='true' />
            <dt>Preferred</dt>
            <dd className='font-semibold text-ink'>{formatDate(r.preferredDate)}</dd>
          </div>
        )}
        <div className='inline-flex items-center gap-1'>
          <Clock className='h-3.5 w-3.5 shrink-0' aria-hidden='true' />
          <dt>Received</dt>
          <dd className='font-semibold text-ink'>{formatDate(r.createdAt)}</dd>
        </div>
      </dl>

      {r.providerNote && (
        <div className='rounded-2xl bg-cream p-3'>
          <p className='font-space text-[10px] uppercase tracking-widest text-black/45'>Your note</p>
          <p className='mt-0.5 line-clamp-2 whitespace-pre-line wrap-break-word text-sm text-ink'>{r.providerNote}</p>
        </div>
      )}

      <div className='mt-auto flex flex-wrap gap-2 border-t border-black/5 pt-4'>
        {transitions.map((t) => {
          const Icon = ACTION_ICON[t]
          return (
            <button key={t} type='button' disabled={busy} onClick={() => onAction(r, t)} className={actionBtnClass[t]}>
              <Icon className='h-4 w-4' aria-hidden='true' />
              {ACTION_LABEL[t]}
            </button>
          )
        })}
        <button type='button' onClick={() => onMessage(r)} className={ghostBtnClass}>
          <MessageSquare className='h-4 w-4' aria-hidden='true' />
          Message
        </button>
        <button type='button' onClick={() => onOpen(r)} className={ghostBtnClass} aria-label={`View details for ${r.service?.title ?? 'request'}`}>
          <Eye className='h-4 w-4' aria-hidden='true' />
          Details
        </button>
      </div>
    </li>
  )
}

export default Projs
