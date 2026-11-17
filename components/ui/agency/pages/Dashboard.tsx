"use client"
import React, { useCallback, useEffect, useState } from 'react'
import DashboardTop from '../dashboard/DashboardTop'
import { ChartBarDefault } from '../BarChart'
import DashboardThird from '../dashboard/DashboardThird'
import DashboardFourth from '../dashboard/DashboardFourth'
import Services from '../dashboard/Services'
import QuickActions from '../dashboard/QuickActions'
import PageHeader from '../PageHeader'
import { btnSecondary, pageWrapper } from '../ui'
import ServiceRequests from '../ServiceRequests'
import { RefreshCw } from '@/components/icons'
import { agencyApi } from '@/services/agency'
import { LoadError, agencyError, type AgencyOverview } from '../agents/shared'

function Dashboard() {
  const [data, setData] = useState<AgencyOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await agencyApi.overview()
      setData(res ?? null)
    } catch (err) {
      setError(agencyError(err, 'Could not load your dashboard.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const name = data?.agency?.name

  return (
    <div className={pageWrapper}>
        <PageHeader
          title='Dashboard'
          subtitle={name ? `How ${name} is doing — projects, team and services.` : 'An overview of your projects, team and services.'}
          actions={
            <button type='button' onClick={load} disabled={loading} className={`${btnSecondary} w-full sm:w-auto`}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          }
        />
        {error ? (
          <>
            <div className='surface-card p-4 sm:p-6'>
              <LoadError error={error} onRetry={load} />
            </div>
            <div className='grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-4'>
              <Services />
              <QuickActions />
            </div>
            <ServiceRequests />
          </>
        ) : (
          <>
            <DashboardTop data={data} loading={loading} />
            <ChartBarDefault data={data?.chart ?? []} loading={loading} />
            <DashboardThird team={data?.team ?? null} loading={loading} />
            <ServiceRequests />
            <DashboardFourth projects={data?.projects ?? null} loading={loading} />
          </>
        )}
    </div>
  )
}

export default Dashboard
