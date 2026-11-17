"use client"
// Shared types + helpers for the agency dashboard's real data (services/agency.js).
import React from 'react'
import { RefreshCw, TriangleAlert } from '@/components/icons'
import { btnSecondary } from '../ui'

export interface Agent {
  id: string
  userId: string
  name: string
  email: string | null
  phone: string | null
  avatar: string | null
  accountActive: boolean
  vehicleType: string | null
  licenseNumber: string | null
  isOnline: boolean
  isVerified: boolean
  rating: number
  totalDeliveries: number
  earningsTotal: number
  activeDeliveries: number
  deliveredThisWeek: number
  failed: number
  joinedAt: string | null
}

export interface AgentStats {
  total: number
  online: number
  active: number
  deliveredThisWeek: number
  earningsTotal: number
}

export type TeamOverview =
  | { available: true; total: number; online: number; activeDeliveries: number; deliveredThisWeek: number; earningsTotal: number; top: Agent[] }
  | { available: false }

export interface AgencyOverview {
  agency: { id: string; name: string; verified: boolean }
  services: { total: number; active: number }
  projects: { total: number; pending: number; active: number; completed: number; declined: number; completedValue: number; pipelineValue: number }
  team: TeamOverview
  chart: { label: string; requests: number; completedValue: number }[]
}

export interface AgencyProfile {
  id: string
  companyName: string | null
  contactPerson: string | null
  registration: string | null
  serviceAreas: string[]
  description: string | null
  phone: string | null
  email: string | null
  address: string | null
  website: string | null
  logo: string | null
  isVerified: boolean
  isActive: boolean
  rating: number
  totalDeliveries: number
  createdAt: string | null
  extendedProfile: boolean
}

export function agencyError(err: unknown, fallback = 'Something went wrong. Please try again.') {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message || fallback
  }
  return fallback
}

export const isAgencyMigrationError = (msg?: string | null) => !!msg && msg.includes('005_agency.sql')

export function AgencyMigrationNotice({ children }: { children?: React.ReactNode }) {
  return (
    <div role='alert' className='flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900'>
      <TriangleAlert size={18} className='mt-0.5 shrink-0 text-amber-600' />
      <p>
        <span className='font-bold'>Database setup needed</span> — run{' '}
        <code className='rounded bg-amber-100 px-1 font-space text-xs'>backend/database/migrations/005_agency.sql</code> in the Supabase SQL editor.
        {children ? <> {children}</> : null}
      </p>
    </div>
  )
}

/** Error block: amber migration notice or red message, plus a retry button. */
export function LoadError({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className='flex flex-col gap-3'>
      {isAgencyMigrationError(error) ? <AgencyMigrationNotice /> : (
        <div role='alert' className='rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700'>{error}</div>
      )}
      {onRetry && <button type='button' onClick={onRetry} className={`${btnSecondary} self-start`}><RefreshCw size={16} /> Try again</button>}
    </div>
  )
}

export function initials(name?: string | null) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function formatRating(rating?: number | null) {
  const n = Number(rating)
  return n > 0 ? n.toFixed(1) : 'New'
}

export function formatDate(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function vehicleLabel(v?: string | null) {
  if (!v) return 'Not set'
  return v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ')
}

export function AgentAvatar({ agent, size = 'md' }: { agent: Pick<Agent, 'name' | 'avatar' | 'isOnline'>; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'h-16 w-16 text-xl' : size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
  const dot = size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'
  return (
    <span className={`relative inline-flex shrink-0 ${dims}`}>
      {agent.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={agent.avatar} alt={agent.name} className={`${dims} rounded-full object-cover`} />
      ) : (
        <span className={`${dims} flex items-center justify-center rounded-full bg-ink font-bold text-lime`}>{initials(agent.name)}</span>
      )}
      <span
        aria-label={agent.isOnline ? 'Online' : 'Offline'}
        className={`absolute bottom-0 right-0 ${dot} rounded-full ring-2 ring-white ${agent.isOnline ? 'bg-emerald-500' : 'bg-black/25'}`}
      />
    </span>
  )
}

export function OnlinePill({ online }: { online: boolean }) {
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${online ? 'bg-emerald-100 text-emerald-800' : 'bg-cream text-black/60'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${online ? 'animate-pulse bg-emerald-500' : 'bg-black/30'}`} />
      {online ? 'Online' : 'Offline'}
    </span>
  )
}

export function VerifiedPill({ verified }: { verified: boolean }) {
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
      {verified ? 'Verified' : 'Unverified'}
    </span>
  )
}
