"use client"
import React from 'react'
import TopAgents from './TopAgents'
import Services from './Services'
import type { TeamOverview } from '../agents/shared'

function DashboardThird({ team, loading }: { team: TeamOverview | null; loading: boolean }) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5'>
        <TopAgents team={team} loading={loading} />
        <Services />
    </div>
  )
}

export default DashboardThird
