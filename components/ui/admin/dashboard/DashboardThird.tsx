"use client"
import React from 'react'
import UserDistribution from './UserDistribution'
import QuickActions from './QuickActions'
import { AdminOverview } from './shared'

function DashboardThird({ data, loading }: { data: AdminOverview | null; loading: boolean }) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5'>
      <UserDistribution byRole={data?.users.byRole ?? null} loading={loading} />
      <QuickActions openDisputes={data?.disputes.open} />
    </div>
  )
}

export default DashboardThird
