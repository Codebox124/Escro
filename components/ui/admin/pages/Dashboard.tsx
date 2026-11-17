"use client"
import React, { useCallback, useEffect, useState } from 'react'
import { adminApi } from '@/services/admin'
import { formatMoney } from '@/lib/money'
import { IconRefresh } from '@/components/icons'
import DashboardTop from '../dashboard/DashboardTop'
import { ChartBarDefault } from '../BarChart'
import DashboardThird from '../dashboard/DashboardThird'
import DashboardFourth from '../dashboard/DashboardFourth'
import PageHeader from '../PageHeader'
import { btnSecondary, pageWrapper } from '../ui'
import { AdminOverview, ErrorCard, errorMessage } from '../dashboard/shared'

function Dashboard() {
  const [data, setData] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = (await adminApi.overview()) as AdminOverview
      setData(res)
    } catch (err) {
      setError(errorMessage(err, 'Could not load the platform overview.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const chart = (data?.chart ?? []).map((m) => ({ label: m.label, value: Number(m.gmv) || 0 }))
  const chartRange = chart.length ? `${chart[0].label} – ${chart[chart.length - 1].label}` : 'Last 6 months'
  const sixMonthGmv = chart.reduce((s, m) => s + m.value, 0)
  const showSkeleton = loading && !data

  return (
    <div className={pageWrapper}>
      <PageHeader
        title='Dashboard'
        subtitle='A live snapshot of users, orders and money moving through Escro.'
        actions={
          <button type='button' onClick={load} disabled={loading} className={`${btnSecondary} w-full sm:w-auto`}>
            <IconRefresh size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />
      {error && !data ? (
        <ErrorCard title="Couldn't load the dashboard" message={error} onRetry={load} />
      ) : (
        <>
          {error && (
            <p role='alert' className='rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700'>
              Refresh failed: {error} Showing the last loaded data.
            </p>
          )}
          <DashboardTop data={data} loading={showSkeleton} />
          <ChartBarDefault
            eyebrow={`${chartRange} · Monthly`}
            title='Gross merchandise value'
            data={chart}
            loading={showSkeleton}
            seriesLabel='GMV'
            badge={`${formatMoney(sixMonthGmv, 'ngn', { compact: true })} in 6 months`}
            emptyMessage='No orders in the last 6 months.'
          />
          <DashboardThird data={data} loading={showSkeleton} />
          <DashboardFourth data={data} loading={showSkeleton} />
        </>
      )}
    </div>
  )
}

export default Dashboard
