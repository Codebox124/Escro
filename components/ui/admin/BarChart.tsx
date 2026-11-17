"use client"

import React from "react"
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts"
import { IconChartBar } from "@/components/icons"
import { formatMoney } from "@/lib/money"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A bar chart"

export interface BarDatum {
  label: string
  value: number
}

interface ChartBarDefaultProps {
  title: string
  eyebrow?: string
  data: BarDatum[]
  loading?: boolean
  /** Small pill on the top-right (e.g. a total) */
  badge?: React.ReactNode
  emptyMessage?: string
  /** Label shown in the tooltip next to the value */
  seriesLabel?: string
}

const chartConfig = {
  value: {
    label: "Volume",
    color: "#0C110E",
  },
} satisfies ChartConfig

export function ChartBarDefault({
  title,
  eyebrow,
  data,
  loading = false,
  badge,
  emptyMessage = "No activity in this period yet.",
  seriesLabel = "Volume",
}: ChartBarDefaultProps) {
  const peak = data.length ? Math.max(...data.map((d) => d.value)) : 0
  const isEmpty = !loading && peak <= 0

  return (
    <div className="surface-card flex min-w-0 flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow font-space text-[11px] text-black/45">{eyebrow}</p>}
          <h2 className="mt-1 text-lg font-extrabold tracking-[-0.02em] text-ink sm:text-xl">{title}</h2>
        </div>
        {badge && !loading && (
          <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-lime px-3 py-1.5 font-space text-xs font-bold text-ink">
            {badge}
          </span>
        )}
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
          <p className="-mt-2 text-sm text-black/55">{emptyMessage}</p>
        </div>
      ) : (
        <ChartContainer config={{ ...chartConfig, value: { ...chartConfig.value, label: seriesLabel } }} className="aspect-auto h-[220px] w-full sm:h-[280px] lg:h-[320px]">
          <BarChart accessibilityLayer data={data} margin={{ left: 0, right: 0 }}>
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              minTickGap={8}
              tick={{ fontFamily: "var(--font-space)", fontSize: 11, fill: "rgb(0 0 0 / 0.45)" }}
              tickFormatter={(value: string) => String(value).toUpperCase()}
            />
            <YAxis
              width={56}
              tickLine={false}
              axisLine={false}
              tickCount={4}
              tick={{ fontFamily: "var(--font-space)", fontSize: 11, fill: "rgb(0 0 0 / 0.45)" }}
              tickFormatter={(value: number) => formatMoney(value, "ngn", { compact: true })}
            />
            <ChartTooltip
              cursor={{ fill: "rgb(244 241 234 / 0.8)" }}
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">{item?.payload?.label ?? seriesLabel}</span>
                      <span className="font-mono font-medium text-foreground tabular-nums">{formatMoney(Number(value), "ngn")}</span>
                    </div>
                  )}
                  hideLabel
                />
              }
            />
            <Bar dataKey="value" fill="var(--color-value)" radius={data.length > 31 ? 2 : data.length > 12 ? 6 : 12} maxBarSize={56}>
              {data.map((d, i) => (
                <Cell key={`${d.label}-${i}`} fill={d.value === peak ? "#C8F169" : "#0C110E"} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </div>
  )
}
