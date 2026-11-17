"use client"
import React from 'react'
import { useAgencyContext } from './AgencyContext'
import {motion} from "framer-motion"
import { alertAnimation, others } from './Animations'
import { CircleAlert, CircleCheck } from '@/components/icons'


function AlertModal() {
    const {alertInfo} = useAgencyContext()
    const bad = alertInfo.type==="bad"
  return (
    <motion.div
    initial={alertAnimation.initial}
    animate={alertAnimation.animate}
    exit={alertAnimation.initial}
    transition={{...others.transition, duration: 0.4, ease:"backInOut"}}
    role='status'
    className='fixed right-4 top-20 z-[200] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full bg-ink py-2 pl-2 pr-5 font-mont text-sm font-semibold text-white shadow-[0_20px_40px_-15px_rgba(12,17,14,0.6)] sm:right-6 sm:top-24 lg:right-8'>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bad ? "bg-red-500 text-white" : "bg-lime text-ink"}`}>
          {bad ? <CircleAlert size={18} /> : <CircleCheck size={18} />}
        </span>
        <p>{alertInfo.title}</p>
    </motion.div>
  )
}

export default AlertModal
