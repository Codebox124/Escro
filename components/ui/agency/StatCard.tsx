import React from 'react'
import { TrendingUp } from '@/components/icons'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  delta?: string
  period?: string
  tone?: "emerald" | "red" | "amber" | "sky"
  /** Render as the page's highlight card */
  variant?: "default" | "ink" | "lime"
}

const pillTones = {
  emerald: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-800",
  sky: "bg-sky-100 text-sky-800",
}

const iconTones = {
  emerald: "bg-cream text-ink",
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-700",
  sky: "bg-sky-50 text-sky-700",
}

function StatCard({ label, value, icon: Icon, delta, period, tone = "emerald", variant = "default" }: StatCardProps) {
  const ink = variant === "ink"
  const lime = variant === "lime"
  const shell = ink
    ? "surface-ink relative overflow-hidden"
    : lime
      ? "relative overflow-hidden rounded-3xl bg-lime text-ink"
      : "surface-card card-hover"
  const iconCls = ink ? "bg-white/10 text-lime" : lime ? "bg-ink text-lime" : iconTones[tone]
  const labelCls = ink ? "text-white/60" : lime ? "text-ink/70" : "text-black/50"
  const valueCls = ink ? "text-white" : "text-ink"
  const pillCls = ink ? "bg-lime text-ink" : lime ? "bg-ink text-lime" : pillTones[tone]
  const periodCls = ink ? "text-white/50" : lime ? "text-ink/60" : "text-black/45"
  return (
    <div className={`${shell} flex min-w-0 flex-col gap-5 p-5 sm:p-6`}>
      {ink && <div className='pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/25 blur-3xl' />}
      <div className='relative flex items-start justify-between gap-3'>
        <p className={`text-sm font-semibold ${labelCls}`}>{label}</p>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconCls}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className={`relative truncate font-space text-3xl font-bold tracking-tight sm:text-4xl ${valueCls}`}>{value}</p>
      {(delta || period) && (
        <div className='relative flex flex-wrap items-center gap-2 text-xs'>
          {delta && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-space font-bold ${pillCls}`}>
              <TrendingUp size={12} />
              {delta}
            </span>
          )}
          {period && <span className={periodCls}>{period}</span>}
        </div>
      )}
    </div>
  )
}

export default StatCard
