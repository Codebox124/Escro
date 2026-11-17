"use client"
import React, { useEffect, useState } from 'react'
import { IoCheckmarkDone } from "@/components/icons"
import { useAdminContext } from '../AdminContext';
import { LuClock2 } from '@/components/icons';
import { TbCancel } from '@/components/icons';

function Stats() {
    const [stats, setStats] = useState({
        completed: 0,
        inProgress:0,
        cancelled:0
    })
    const {projects} = useAdminContext();

    useEffect(()=>{
        const completedProjects = projects.filter((project:any)=> project.status==="Completed").length
        const inProgressProjects = projects.filter((project:any)=> project.status==="In Progress").length
        const cancelledProjects = projects.filter((project:any)=> project.status==="Cancelled").length
        setStats({
            completed: completedProjects,
            inProgress: inProgressProjects,
            cancelled: cancelledProjects
        })
    }, [projects])
  return (
    <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 sm:gap-4">
        <div className="surface-card flex min-w-0 items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-ink"><IoCheckmarkDone  className="h-4 w-4" /></span>
          <div className="min-w-0">
            <p className="truncate font-space text-[11px] uppercase tracking-widest text-black/45">Completed</p>
            <p className="font-space text-2xl font-bold tracking-tight text-ink">{stats.completed}</p>
          </div>
        </div>

        <div className="surface-card flex min-w-0 items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><LuClock2  className="h-4 w-4" /></span>
          <div className="min-w-0">
            <p className="truncate font-space text-[11px] uppercase tracking-widest text-black/45">In Progress</p>
            <p className="font-space text-2xl font-bold tracking-tight text-ink">{stats.inProgress}</p>
          </div>
        </div>

        <div className="surface-card flex min-w-0 items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><TbCancel  className="h-4 w-4" /></span>
          <div className="min-w-0">
            <p className="truncate font-space text-[11px] uppercase tracking-widest text-black/45">Cancelled</p>
            <p className="font-space text-2xl font-bold tracking-tight text-ink">{stats.cancelled}</p>
          </div>
        </div>
    </div>
  )
}

export default Stats