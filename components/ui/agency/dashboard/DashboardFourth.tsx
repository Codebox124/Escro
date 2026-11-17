"use client"
import React from 'react'
import ProjectPipeline from './ProjectPipeline'
import QuickActions from './QuickActions'
import type { AgencyOverview } from '../agents/shared'

function DashboardFourth({ projects, loading }: { projects: AgencyOverview['projects'] | null; loading: boolean }) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5'>
        <ProjectPipeline projects={projects} loading={loading} />
        <QuickActions />
    </div>
  )
}

export default DashboardFourth
