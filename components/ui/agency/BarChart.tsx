"use client"

import React, { useState } from "react"
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts"
import { IconChartBar } from "@/components/icons"
import { formatMoney } from "@/lib/money"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "Agency activity bar chart"

export interface AgencyChartPoint {
  label: string
  requests: number
  completedValue: number
}

type Metric = "requests" | "completedValue"

const METRICS: { key: Metric; label: string; title: string }[] = [
  { key: "requests", label: "Requests", title: "Project requests" },
  { key: "completedValue", label: "Value", title: "Completed value" },
]

const chartConfig = {
  value: { label: "Value", color: "#0C110E" },
} satisfies ChartConfig

const tick = { fontFamily: "var(--font-space)", fontSize: 11, fill: "rgb(0 0 0 / 0.45)" }

export function ChartBarDefault({ data, loading = false }: { data: AgencyChartPoint[]; loading?: boolean }) {
  const [metric, setMetric] = useState<Metric>("requests")
  const active = METRICS.find((m) => m.key === metric)!
  const money = metric === "completedValue"

  const series = data.map((d) => ({ label: d.label, value: Number(d[metric]) || 0 }))
  const peak = series.length ? Math.max(...series.map((d) => d.value)) : 0
  const total = series.reduce((sum, d) => sum + d.value, 0)
  const isEmpty = !loading && peak <= 0
  const range = data.length ? `${data[0].label} – ${data[data.length - 1].label}` : "Last 6 months"
  const fmt = (v: number) => (money ? formatMoney(v, "ngn", { decimals: 0 }) : v.toLocaleString("en-NG"))

  return (
    <div className="surface-card flex min-w-0 flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow font-space text-[11px] text-black/45">{range}</p>
          <h2 className="mt-1 text-lg font-extrabold tracking-[-0.02em] text-ink sm:text-xl">{active.title}</h2>
          {!loading && (
            <p className="mt-0.5 text-sm text-black/55">
              <span className="font-space font-bold text-ink">{fmt(total)}</span> over {series.length || 6} months
            </p>
          )}
        </div>
        <div role="tablist" aria-label="Chart metric" className="inline-flex rounded-full bg-cream p-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={metric === m.key}
              onClick={() => setMetric(m.key)}
              className={`h-9 cursor-pointer rounded-full px-3.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
                metric === m.key ? "bg-ink text-white" : "text-black/60 hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div aria-hidden className="flex h-[220px] items-end gap-3 sm:h-[280px] lg:h-[320px]">
          {[45, 70, 30, 85, 55, 65].map((h, i) => (
            <div key={i} style={{ height: `${h}%` }} className="flex-1 animate-pulse rounded-xl bg-black/[0.06]" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex h-[220px] flex-col items-center justify-center gap-3 rounded-2xl bg-cream/60 px-4 text-center sm:h-[280px] lg:h-[320px]">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black/50 ring-1 ring-black/5">
            <IconChartBar size={18} />
          </span>
          <p className="text-sm font-bold text-ink">Nothing to chart yet</p>
          <p className="-mt-2 text-sm text-black/55">
            {money ? "Completed projects will show their value here." : "Requests on your services will show up here."}
          </p>
        </div>
      ) : (
        <ChartContainer
          config={{ value: { ...chartConfig.value, label: active.title } }}
          className="aspect-auto h-[220px] w-full sm:h-[280px] lg:h-[320px]"
        >
          <BarChart accessibilityLayer data={series} margin={{ left: 0, right: 0 }}>
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={tick}
              tickFormatter={(value: string) => String(value).toUpperCase()}
            />
            <YAxis
              width={money ? 56 : 32}
              tickLine={false}
              axisLine={false}
              tickCount={4}
              allowDecimals={false}
              tick={tick}
              tickFormatter={(value: number) => (money ? formatMoney(value, "ngn", { compact: true }) : String(value))}
            />
            <ChartTooltip
              cursor={{ fill: "rgb(244 241 234 / 0.8)" }}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">{item?.payload?.label}</span>
                      <span className="font-mono font-medium text-foreground tabular-nums">{fmt(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="value" fill="var(--color-value)" radius={[12, 12, 12, 12]} maxBarSize={56}>
              {series.map((d, i) => (
                <Cell key={`${d.label}-${i}`} fill={d.value === peak ? "#C8F169" : "#0C110E"} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </div>
  )
}
