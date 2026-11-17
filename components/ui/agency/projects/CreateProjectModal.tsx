"use client"

import React, { useEffect, useState } from 'react'

import { useAgencyContext } from '../AgencyContext';
import { X } from '@/components/icons';
import { btnPrimary, btnSecondary, inputBase, modalOverlay, modalPanel } from '../ui';

interface AddProjectProps{
    setShowCreateProjectModal: any
}

function CreateProjectModal({setShowCreateProjectModal}:AddProjectProps) {
  const {projects, setProjects, handleAlert} = useAgencyContext();
  const [milestones, setMilestones] = useState<any[]>([])
  const [isReady, setIsReady] = useState(false)
  
  const [mileText, setMileText] = useState("") 
  const [newProject, setNewProject] = useState({
    id:`${projects.length}`,
    name: "",
    client: "",
    date: "",
    progress: "0%",
    status: "In Progress",
    milestones: [{title:"", completed: false}]
  })

  useEffect(()=>{
    if(newProject.name && newProject.client && newProject.date && milestones.length!=0){
      setIsReady(true)
    }else{
      setIsReady(false)
    }
  }, [newProject])

   useEffect(()=>{
    if(newProject.name && newProject.client && newProject.date && milestones.length!=0){
      setIsReady(true)
    }else{
      setIsReady(false)
    }
  }, [milestones])

 

  function handlenewProject(){ 
    setProjects([...projects, {...newProject, milestones:milestones}])
    setShowCreateProjectModal(false)
    handleAlert("Project Added!", "good")
  }

  function handleMilestone(milestone:string){
    setMilestones([...milestones, {title:milestone, completed:false}])
    setMileText("")
  }

  function handleRemoveMileStone(mile:any){
    const newMileStones = milestones.filter((milestone:any)=> milestone!=mile)
    setMilestones(newMileStones)
  }
  return (
    <div className={`${modalOverlay} z-[60]`}>
        <div className={`${modalPanel} font-mont`}>
            <div className='flex items-start justify-between gap-3 border-b border-black/5 p-5 sm:px-6'>
                <div>
                    <h3 className='text-lg font-extrabold tracking-[-0.02em] text-ink'>Add New Project</h3>
                    <p className='mt-1 text-sm text-black/55'>Fill in the details below to add a new project.</p>
                </div>
                <button type='button' aria-label='Close' onClick={()=>{setShowCreateProjectModal(false)}} className='inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-cream text-ink transition-colors hover:bg-lime'><X size={18} /></button>
            </div>
            <div className='flex flex-col gap-4 p-5 sm:px-6'>
                <label className='flex flex-col gap-1.5 text-sm font-medium text-black/70'>Project name
                    <input value={newProject.name} onChange={(e)=>{setNewProject({...newProject, name:e.target.value })}} type="text" placeholder='e.g. Frontend Development' className={inputBase}/>
                </label>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <label className='flex flex-col gap-1.5 text-sm font-medium text-black/70'>Client
                        <input value={newProject.client} onChange={(e)=>{setNewProject({...newProject, client:e.target.value })}} type="text" placeholder='e.g. Ryan LLC' className={inputBase} />
                    </label>
                    <label className='flex flex-col gap-1.5 text-sm font-medium text-black/70'>Due date
                        <input value={newProject.date} onChange={(e)=>{setNewProject({...newProject, date:e.target.value })}} type="date"  className={inputBase} />
                    </label>
                </div>
                <label className='flex flex-col gap-1.5 text-sm font-medium text-black/70'>Milestones
                    <input onKeyDown={(e:any)=>{e.key==="Enter" && handleMilestone(e.target.value)}} value={mileText} onChange={(e)=>{setMileText(e.target.value)}} type="text" placeholder='Type a milestone and press Enter...'  className={inputBase} />
                </label>
                <div className='flex min-h-14 flex-wrap gap-2 rounded-2xl border border-dashed border-black/15 bg-cream/40 bg-cream/50 p-3 text-sm text-black/55'>
                    {
                      milestones.length!=0? milestones.map((mile:any, index:any)=>{
                        return <span onClick={()=>{handleRemoveMileStone(mile)}} key={index} className='inline-flex w-fit cursor-pointer items-center gap-1 rounded-xl bg-white px-2 py-1 text-sm font-medium text-black/70 ring-1 ring-black/10 transition-colors hover:text-red-600 hover:ring-red-200'><X size={14} /> {mile.title}</span>
                      }):"No Milestones"
                    }
                </div>
            </div>
            <div className='flex flex-col-reverse gap-2 border-t border-black/5 bg-cream/50 p-4 sm:flex-row sm:justify-end sm:px-6'>
                <button onClick={()=>{setShowCreateProjectModal(false)}} className={btnSecondary}>Cancel</button>
                <button disabled={!isReady} onClick={handlenewProject} className={btnPrimary}>Add New Project</button>
            </div>
        </div>
    </div>
  )
}

export default CreateProjectModal
