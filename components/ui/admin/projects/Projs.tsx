"use client"
import React from 'react'
import { CalendarDays, FolderOpen } from '@/components/icons'
import { statusPill } from '../ui'
import { useAdminContext } from '../AdminContext';


function Projs() {
    const {projects, isSearchingProjects, projectsSearchResults, setSelectedProject, setShowProjectInfo} = useAdminContext();
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {(projects.length!=0 && isSearchingProjects) ? projectsSearchResults.map((project:any, index:number) => (
                <Project onClick={()=>{setSelectedProject(project); setShowProjectInfo(true)}} key={index} name={project.name} client={project.client} progress={project.progress} date={project.date} status={project.status} />
            )):
            (projects.length!=0 && !isSearchingProjects) ? projects.map((project:any, index:number) => (
                <Project onClick={()=>{setSelectedProject(project); setShowProjectInfo(true)}} key={index} name={project.name} client={project.client} progress={project.progress} date={project.date} status={project.status} />
            )):
            <div className='surface-card col-span-full flex flex-col items-center justify-center gap-2 py-16 text-sm text-black/55'><FolderOpen size={28} className='text-black/25' />No Active Projects</div>}
    </div>
  )
}

export default Projs


interface ProjectProps{
    name: string
    client: string
    progress: string
    date: string
    status: string,
    onClick : any
}

function Project({name, client, progress, date, status, onClick}: ProjectProps){
    return (
        <button type='button' onClick={onClick} className='surface-card card-hover flex w-full cursor-pointer flex-col gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60'>
            <div className='flex w-full items-start justify-between gap-3'>
                <div className='min-w-0'>
                    <p className='truncate font-semibold text-ink'>{name}</p>
                    <p className='truncate text-sm text-black/55'>{client}</p>
                </div>
                <span className={statusPill(status)}>{status}</span>
            </div>
            <div className='w-full'>
                <div className='flex items-center justify-between gap-3 text-xs font-medium text-black/55'>
                    <span>Progress</span>
                    <span className='font-space font-bold text-ink'>{progress}</span>
                </div>
                <div className='mt-1.5 h-2 w-full overflow-hidden rounded-full bg-cream'>
                    <span style={{width: progress}} className={`block h-full rounded-full transition-[width] duration-300 ease-in-out ${status==="Cancelled" ? "bg-black/15" : "bg-ink"}`} />
                </div>
            </div>
            <div className='flex items-center gap-1.5 border-t border-black/5 pt-3 text-xs text-black/55'>
                <CalendarDays size={14} />
                <span className='font-space'>{date}</span>
            </div>
        </button>
    )
}
