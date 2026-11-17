"use client"
import React, { useEffect } from 'react'
import { CalendarDays, Car, Mail, Phone, ShieldCheck, Star, Trash2, X } from '@/components/icons';
import { motion } from "framer-motion"
import { alertAnimation } from '../Animations';
import { btnPrimary, btnSecondary, monoLabel } from '../ui';
import { formatMoney } from '@/lib/money';
import { Agent, AgentAvatar, OnlinePill, VerifiedPill, formatDate, formatRating, vehicleLabel } from './shared';

interface AgentInfoProps {
  agent: Agent
  onClose: () => void
  onRemove?: (agent: Agent) => void
}

function AgentInfo({ agent, onClose, onRemove }: AgentInfoProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const rating = formatRating(agent.rating)
  const metrics = [
    { label: 'Active deliveries', value: agent.activeDeliveries },
    { label: 'Delivered this week', value: agent.deliveredThisWeek },
    { label: 'Total deliveries', value: agent.totalDeliveries },
    { label: 'Failed', value: agent.failed },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      role='dialog'
      aria-modal='true'
      aria-labelledby='agent-info-title'
      className='fixed inset-0 z-50 flex justify-end bg-ink/50 font-mont backdrop-blur-sm'
    >
      <motion.div
        initial={alertAnimation.initial}
        exit={alertAnimation.initial}
        animate={alertAnimation.animate}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        onClick={(e) => e.stopPropagation()}
        className='flex h-full w-full flex-col overflow-hidden bg-white shadow-[0_0_80px_-20px_rgba(12,17,14,0.5)] sm:max-w-md sm:rounded-l-3xl lg:max-w-lg'
      >
        <div className='flex items-start justify-between gap-3 border-b border-black/5 p-5 sm:px-6'>
          <div className='min-w-0'>
            <h2 id='agent-info-title' className='text-lg font-extrabold tracking-[-0.02em] text-ink'>Agent details</h2>
            <p className='truncate text-sm text-black/55'>Performance and contact info for {agent.name}</p>
          </div>
          <button type='button' aria-label='Close' onClick={onClose} className='inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-cream text-ink transition-colors hover:bg-lime'><X size={18} /></button>
        </div>

        <div className='flex flex-1 flex-col gap-4 overflow-y-auto p-5 sm:p-6'>
          <div className='surface-card p-5'>
            <div className='flex items-center gap-4'>
              <AgentAvatar agent={agent} size='lg' />
              <div className='flex min-w-0 flex-col gap-1.5'>
                <span className='truncate text-lg font-extrabold tracking-[-0.02em] text-ink'>{agent.name}</span>
                <div className='flex flex-wrap gap-1.5'>
                  <OnlinePill online={agent.isOnline} />
                  <VerifiedPill verified={agent.isVerified} />
                  {!agent.accountActive && <span className='inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700'>Account suspended</span>}
                </div>
              </div>
            </div>
            <div className='mt-5 flex flex-col gap-2 border-t border-black/5 pt-4 text-sm'>
              {agent.email && (
                <a href={`mailto:${agent.email}`} className='flex min-w-0 items-center gap-2 rounded-xl px-1 py-1 text-ink hover:bg-cream'>
                  <Mail size={16} className='shrink-0 text-black/45' /><span className='truncate'>{agent.email}</span>
                </a>
              )}
              {agent.phone && (
                <a href={`tel:${agent.phone}`} className='flex min-w-0 items-center gap-2 rounded-xl px-1 py-1 text-ink hover:bg-cream'>
                  <Phone size={16} className='shrink-0 text-black/45' /><span className='truncate'>{agent.phone}</span>
                </a>
              )}
              {!agent.email && !agent.phone && <p className='text-black/45'>No contact details on file.</p>}
            </div>
          </div>

          <div className='surface-ink relative overflow-hidden p-5'>
            <p className='text-sm font-semibold text-white/60'>Lifetime earnings</p>
            <p className='mt-2 truncate font-space text-3xl font-bold tracking-tight text-white'>{formatMoney(agent.earningsTotal, 'ngn')}</p>
            <p className='mt-2 inline-flex items-center gap-1 text-xs text-white/60'>
              <Star size={12} className={rating === 'New' ? 'text-white/40' : 'text-lime'} />
              {rating === 'New' ? 'No ratings yet' : `${rating} average rating`}
            </p>
          </div>

          <dl className='grid grid-cols-2 gap-3'>
            {metrics.map((m) => (
              <div key={m.label} className='rounded-2xl bg-cream/60 p-4'>
                <dt className={monoLabel}>{m.label}</dt>
                <dd className='mt-1 font-space text-2xl font-bold text-ink'>{Number(m.value) || 0}</dd>
              </div>
            ))}
          </dl>

          <dl className='surface-card grid grid-cols-1 gap-4 p-5 text-sm min-[400px]:grid-cols-2'>
            <div>
              <dt className={`flex items-center gap-1.5 ${monoLabel}`}><Car size={12} /> Vehicle</dt>
              <dd className='mt-1 font-medium text-ink'>{vehicleLabel(agent.vehicleType)}</dd>
            </div>
            <div>
              <dt className={`flex items-center gap-1.5 ${monoLabel}`}><ShieldCheck size={12} /> Licence</dt>
              <dd className='mt-1 truncate font-medium text-ink'>{agent.licenseNumber || 'Not provided'}</dd>
            </div>
            <div>
              <dt className={`flex items-center gap-1.5 ${monoLabel}`}><CalendarDays size={12} /> Joined</dt>
              <dd className='mt-1 font-medium text-ink'>{formatDate(agent.joinedAt)}</dd>
            </div>
          </dl>
        </div>

        <div className='flex flex-col-reverse gap-2 border-t border-black/5 p-4 sm:flex-row sm:px-6'>
          {onRemove && (
            <button type='button' onClick={() => onRemove(agent)} className={`${btnSecondary} hover:border-red-600 hover:text-red-600 sm:flex-1`}><Trash2 size={16} /> Remove from team</button>
          )}
          <button type='button' onClick={onClose} className={`${btnPrimary} sm:flex-1`}>Close</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AgentInfo
