"use client"
import React from 'react'
import { Eye, Mail, Phone, Star, Trash2 } from '@/components/icons'
import { formatMoney } from '@/lib/money'
import { monoLabel } from '../ui'
import { Agent, AgentAvatar, OnlinePill, VerifiedPill, formatDate, formatRating, vehicleLabel } from './shared'

const iconBtn = 'inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-black/50 transition-colors hover:bg-cream hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60'
const th = 'whitespace-nowrap px-3 py-3 text-left font-space text-[11px] font-medium uppercase tracking-widest text-black/45'
const td = 'whitespace-nowrap px-3 py-3 align-middle'

interface AgentListProps {
  agents: Agent[]
  onView: (a: Agent) => void
  onRemove: (a: Agent) => void
}

function Contact({ agent }: { agent: Agent }) {
  return (
    <div className='flex min-w-0 flex-col gap-0.5 text-xs'>
      {agent.email ? (
        <a href={`mailto:${agent.email}`} onClick={(e) => e.stopPropagation()} className='flex min-w-0 items-center gap-1.5 text-black/60 hover:text-ink hover:underline'>
          <Mail size={12} className='shrink-0' /><span className='truncate'>{agent.email}</span>
        </a>
      ) : null}
      {agent.phone ? (
        <a href={`tel:${agent.phone}`} onClick={(e) => e.stopPropagation()} className='flex min-w-0 items-center gap-1.5 text-black/60 hover:text-ink hover:underline'>
          <Phone size={12} className='shrink-0' /><span className='truncate'>{agent.phone}</span>
        </a>
      ) : null}
      {!agent.email && !agent.phone && <span className='text-black/40'>No contact</span>}
    </div>
  )
}

function Rating({ rating }: { rating: number }) {
  const label = formatRating(rating)
  return (
    <span className='inline-flex items-center gap-1 font-space text-sm font-bold text-ink'>
      <Star size={13} className={label === 'New' ? 'text-black/25' : 'text-amber-500'} />{label}
    </span>
  )
}

function AgentList({ agents, onView, onRemove }: AgentListProps) {
  return (
    <>
      {/* Desktop table */}
      <div className='surface-card hidden overflow-x-auto lg:block'>
        <table className='w-full min-w-[1000px] text-sm'>
          <thead className='border-b border-black/5'>
            <tr>
              <th className={`${th} pl-5`}>Agent</th>
              <th className={th}>Contact</th>
              <th className={th}>Vehicle</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right`}>Active</th>
              <th className={`${th} text-right`}>This week</th>
              <th className={`${th} text-right`}>Total</th>
              <th className={`${th} text-right`}>Earnings</th>
              <th className={th}>Rating</th>
              <th className={th}>Joined</th>
              <th className={`${th} pr-5`}><span className='sr-only'>Actions</span></th>
            </tr>
          </thead>
          <tbody className='divide-y divide-black/5'>
            {agents.map((agent) => (
              <tr key={agent.id} onClick={() => onView(agent)} className='cursor-pointer transition-colors hover:bg-cream/50'>
                <td className={`${td} pl-5`}>
                  <div className='flex items-center gap-3'>
                    <AgentAvatar agent={agent} size='sm' />
                    <div className='min-w-0'>
                      <p className='max-w-[180px] truncate font-semibold text-ink'>{agent.name}</p>
                      {!agent.accountActive && <p className='text-xs font-semibold text-red-600'>Account suspended</p>}
                    </div>
                  </div>
                </td>
                <td className={`${td} max-w-[220px]`}><Contact agent={agent} /></td>
                <td className={`${td} text-black/70`}>{vehicleLabel(agent.vehicleType)}</td>
                <td className={td}>
                  <div className='flex flex-col gap-1'>
                    <OnlinePill online={agent.isOnline} />
                    <VerifiedPill verified={agent.isVerified} />
                  </div>
                </td>
                <td className={`${td} text-right font-space font-bold text-ink`}>{agent.activeDeliveries}</td>
                <td className={`${td} text-right font-space text-ink`}>{agent.deliveredThisWeek}</td>
                <td className={`${td} text-right font-space text-ink`}>{agent.totalDeliveries}</td>
                <td className={`${td} text-right font-space font-bold text-ink`}>{formatMoney(agent.earningsTotal, 'ngn', { decimals: 0 })}</td>
                <td className={td}><Rating rating={agent.rating} /></td>
                <td className={`${td} font-space text-xs text-black/55`}>{formatDate(agent.joinedAt)}</td>
                <td className={`${td} pr-5`}>
                  <div className='flex justify-end gap-1'>
                    <button type='button' aria-label={`View ${agent.name}`} onClick={(e) => { e.stopPropagation(); onView(agent) }} className={iconBtn}><Eye size={16} /></button>
                    <button type='button' aria-label={`Remove ${agent.name} from team`} onClick={(e) => { e.stopPropagation(); onRemove(agent) }} className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile / tablet cards */}
      <ul className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden'>
        {agents.map((agent) => (
          <li key={agent.id} className='surface-card flex min-w-0 flex-col gap-4 p-4'>
            <div className='flex items-start gap-3'>
              <AgentAvatar agent={agent} />
              <div className='min-w-0 flex-1'>
                <p className='truncate font-semibold text-ink'>{agent.name}</p>
                <p className='truncate text-xs text-black/55'>{vehicleLabel(agent.vehicleType)} · Joined {formatDate(agent.joinedAt)}</p>
                <div className='mt-2 flex flex-wrap gap-1.5'>
                  <OnlinePill online={agent.isOnline} />
                  <VerifiedPill verified={agent.isVerified} />
                  {!agent.accountActive && <span className='inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700'>Suspended</span>}
                </div>
              </div>
            </div>
            <Contact agent={agent} />
            <dl className='grid grid-cols-3 gap-2 rounded-2xl bg-cream/60 p-3 text-center'>
              <div><dt className={monoLabel}>Active</dt><dd className='mt-0.5 font-space font-bold text-ink'>{agent.activeDeliveries}</dd></div>
              <div><dt className={monoLabel}>Week</dt><dd className='mt-0.5 font-space font-bold text-ink'>{agent.deliveredThisWeek}</dd></div>
              <div><dt className={monoLabel}>Total</dt><dd className='mt-0.5 font-space font-bold text-ink'>{agent.totalDeliveries}</dd></div>
            </dl>
            <div className='flex items-center justify-between gap-3'>
              <div className='min-w-0'>
                <p className='truncate font-space text-base font-bold text-ink'>{formatMoney(agent.earningsTotal, 'ngn', { decimals: 0 })}</p>
                <Rating rating={agent.rating} />
              </div>
              <div className='flex shrink-0 gap-1'>
                <button type='button' aria-label={`Remove ${agent.name} from team`} onClick={() => onRemove(agent)} className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}><Trash2 size={16} /></button>
                <button type='button' onClick={() => onView(agent)} className='inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-ink px-3.5 text-xs font-bold text-white transition-colors hover:bg-ink-soft [&_svg]:text-lime'><Eye size={14} /> Details</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

export function AgentListSkeleton() {
  return (
    <div className='surface-card flex flex-col divide-y divide-black/5 p-2' aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className='flex animate-pulse items-center gap-3 p-3'>
          <div className='h-10 w-10 shrink-0 rounded-full bg-black/5' />
          <div className='flex-1 space-y-2'>
            <div className='h-3.5 w-1/3 rounded-full bg-black/5' />
            <div className='h-3 w-1/2 rounded-full bg-black/5' />
          </div>
          <div className='hidden h-6 w-20 rounded-full bg-black/5 sm:block' />
          <div className='hidden h-4 w-16 rounded-full bg-black/5 sm:block' />
        </div>
      ))}
    </div>
  )
}

export default AgentList
