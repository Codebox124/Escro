"use client"
import React, { useEffect, useState } from 'react'


import { Checkbox } from "@/components/ui/checkbox"

import { useAdminContext } from '../AdminContext';
import { IoCalendarClearOutline } from '@/components/icons';
import { CalendarDays, X } from '@/components/icons';
import { btnDanger, btnPrimary, btnSecondary, modalOverlay, modalPanel, statusPill } from '../ui';
import {motion} from "framer-motion"
import { alertAnimation, others } from '../Animations';

const btnDangerOutline = 'inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-red-200 bg-white px-5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:border-black/10 disabled:text-black/40 disabled:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40'

function ProjectInfo() {
    const {setShowProjectInfo, selectedProject, projects, setProjects, setSelectedProject, calculateProgress, handleAlert} = useAdminContext();
     const [showCancelProjectModal, setShowCancelProjectModal] = useState(false)
   

    function handleUpdateMilestone(project:any, milestone:any){
        const completed = milestone.completed
        let newProjects = projects.map((proj:any)=>{
            if(proj.id===project.id){
                let milestones = proj.milestones
                milestones = milestones.map((mile:any)=>{
                    if(mile===milestone){
                        return {...mile, completed:!completed}
                    }else{
                        return mile
                    }
                })


                const allCompleted = milestones.filter((mile:any)=>mile.completed===true)
                const progress = Math.trunc((allCompleted.length/milestones.length) * 100)
                setSelectedProject({...proj, milestones: milestones, progress:`${progress}%`})
                return {...proj, milestones: milestones}
            }else{
                return proj
            }
        })
 
        calculateProgress(newProjects)
        

        //setProjects(newProjects)
    }


    function handleCancelProject(){
        const newProjects = projects.map((proj:any)=>{
            if(proj.id===selectedProject.id){
                return {...proj, status:"Cancelled"}
            }else{
                return proj
            }
        })
        setSelectedProject((prev:any)=>({...prev, status:"Cancelled"}))
        setProjects(newProjects)
        setShowCancelProjectModal(false)
        handleAlert("Project Cancelled", "bad")
    }

   

  return <>
  {
    showCancelProjectModal && <CancelProjectModal projectToCancel={selectedProject} setShowCancelProjectModal={setShowCancelProjectModal} handleCancelProject={handleCancelProject}  />
  }
    <motion.div
    initial={{opacity: 0}}
    animate={{opacity: 1}}
    exit={{opacity: 0}}
    transition={{duration: 0.2}}
    className='fixed inset-0 z-50 flex justify-end bg-ink/50 font-mont backdrop-blur-sm'>
        <motion.div
        initial={alertAnimation.initial}
        exit={alertAnimation.initial}
        animate={alertAnimation.animate}
        transition={{
        duration: 0.3,
        ease:"easeInOut"
        }}
        className='flex h-full w-full flex-col overflow-hidden bg-white shadow-[0_0_80px_-20px_rgba(12,17,14,0.5)] sm:max-w-md sm:rounded-l-3xl lg:max-w-lg'
        >
            <div className='flex items-start justify-between gap-3 border-b border-black/5 p-5 sm:px-6'>
                <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                        <h2 className='truncate text-lg font-extrabold tracking-[-0.02em] text-ink'>{selectedProject.name}</h2>
                        <span className={statusPill(selectedProject.status)}>{selectedProject.status}</span>
                    </div>
                    <p className='truncate text-sm text-black/55'>{selectedProject.client}</p>
                </div>
                <button type='button' aria-label='Close' onClick={() => setShowProjectInfo(false)} className='inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-cream text-ink transition-colors hover:bg-lime'><X size={18} /></button>
            </div>
            <div className='flex flex-1 flex-col gap-5 overflow-y-auto p-5 sm:p-6'>
                {/*Project Info */}
                <div className='surface-card flex flex-col gap-3 p-4'>
                    <div className='flex items-center justify-between gap-3 text-sm font-medium text-black/55'>
                        <span>Progress</span>
                        <span className='font-space text-xl font-bold text-ink'>{selectedProject.progress}</span>
                    </div>
                    <div className='h-2.5 w-full overflow-hidden rounded-full bg-cream'>
                        <span style={{width: selectedProject.progress}} className={`block h-full rounded-full transition-[width] duration-300 ease-in-out ${selectedProject.status==="Cancelled" ? "bg-black/15" : "bg-ink"}`} />
                    </div>
                    <div className='flex items-center gap-1.5 text-xs text-black/55'>
                        <CalendarDays size={14} />
                        <span>{selectedProject.date}</span>
                    </div>
                </div>
                <div>
                    <h3 className='mb-2 font-space text-[11px] uppercase tracking-widest text-black/45'>Milestones</h3>
                    <div className='flex flex-col divide-y divide-black/5 rounded-2xl border border-black/5'>
                {
                    selectedProject.milestones.map((mile:any, index:number)=>(
                        <label key={index} className={`flex cursor-pointer items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-cream/60 ${selectedProject.status==="Cancelled"?"cursor-not-allowed text-black/40":"text-ink/90"} ${mile.completed ? "line-through decoration-black/20" : ""}`}>
                    <Checkbox  disabled={selectedProject.status==="Cancelled"} onClick={()=>{handleUpdateMilestone(selectedProject, mile)}} checked={mile.completed} className='data-[state=checked]:border-none data-[state=checked]:bg-ink data-[state=checked]:text-lime' />
                    <span>{mile.title}</span>
                </label>
                    ))
                }
                    </div>
                </div>
                
            </div>
            <div className='flex flex-col-reverse gap-2 border-t border-black/5 p-4 sm:flex-row sm:px-6'>
                <button disabled={selectedProject.status==="Cancelled"} onClick={()=>{setShowCancelProjectModal(true)}} className={`${btnDangerOutline} sm:flex-1`}>Cancel Project</button>
                <button onClick={() => setShowProjectInfo(false)} className={`${btnPrimary} sm:flex-1`}>Close</button>
            </div>
        </motion.div>
    </motion.div>
  </>
}

export default ProjectInfo







interface DeleteServiceProps{
    setShowCancelProjectModal: any
    projectToCancel: any
    handleCancelProject: any
}
function CancelProjectModal({setShowCancelProjectModal, projectToCancel, handleCancelProject}:DeleteServiceProps){
    const {services, setServices, handleAlert} = useAdminContext();
    
   /* function handleDeleteService(){
        const newServices = services.filter((service:any)=>{
            return service!=ProjctToDelete
        })

        setServices(newServices)
        setShowCancelProjectModal(false)
        handleAlert("Service Deleted!", "bad")
    }*/
   return <div className={`${modalOverlay} z-[60]`}>
            <div className={`${modalPanel} font-mont`}>
                <div className='p-5 sm:p-6'>
                    <h3 className='text-lg font-extrabold tracking-[-0.02em] text-ink'>Cancel Project</h3>
                    <p className='mt-1 text-sm text-black/55'>Are you sure you want to cancel this project? This action is irreversible.</p>
                    <div className='mt-4 rounded-2xl border border-red-100 bg-red-50/60 p-4'>
                        <p className='font-semibold text-ink'>{projectToCancel.name}</p>
                        <p className='text-sm text-black/55'>{projectToCancel.client}</p>
                    </div>
                </div>
                <div className='flex flex-col-reverse gap-2 border-t border-black/5 bg-cream/50 p-4 sm:flex-row sm:justify-end sm:px-6'>
                    <button onClick={()=>{setShowCancelProjectModal(false)}} className={btnSecondary}>Keep Project</button>
                    <button onClick={handleCancelProject} className={btnDanger}>Cancel Project</button>
                </div>
            </div>
        </div>
}
