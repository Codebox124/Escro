import React from 'react'
import {motion} from "framer-motion"

function FloatingCard() {
  return (
    <motion.div
    initial={{opacity: 0, y: -8}}
    animate={{opacity: 1, y: 0}}
    exit={{opacity: 0, y: -8}}
    transition={{duration: 0.15}}
    className='fixed left-4 right-4 top-[4.5rem] z-40 flex max-h-[70dvh] flex-col overflow-hidden rounded-3xl bg-white font-mont shadow-[0_30px_60px_-20px_rgba(12,17,14,0.35)] ring-1 ring-black/5 sm:left-auto sm:right-6 sm:top-[5.5rem] sm:w-96 lg:right-8'>
        <div className='flex items-center justify-between gap-3 bg-ink px-5 py-4'>
          <div>
            <p className='eyebrow font-space text-[10px] text-white/45'>Inbox</p>
            <p className='mt-0.5 text-base font-extrabold tracking-tight text-white'>Notifications</p>
          </div>
          <span className='rounded-full bg-lime px-2.5 py-1 font-space text-[11px] font-bold text-ink'>1 new</span>
        </div>
        <div className='flex flex-col divide-y divide-black/5 overflow-y-auto'>
          <Notification notis="New project assigned to you" time="2 hours ago" viewed={false}/>
          <Notification notis="Meeting scheduled with client" time="1 day ago" viewed={true}/>
          <Notification notis="Invoice #12345 paid" time="3 days ago" viewed={true}/>
         {/*} <p>No new notifications</p>*/}
        </div>
    </motion.div>
  )
}

export default FloatingCard


interface NotificationProps{
  notis: string
  time: string
  viewed: boolean
}
function Notification({notis, time, viewed}: NotificationProps){
  return <div className={`flex cursor-pointer items-start gap-3 px-5 py-4 transition-colors hover:bg-cream/60 ${!viewed?"bg-lime/15":""}`}>
    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!viewed ? "bg-lime-dark" : "bg-black/15"}`} />
    <div className='min-w-0'>
      <p className={`text-sm ${!viewed ? "font-bold text-ink" : "text-black/70"}`}>{notis}</p>
      <p className='mt-0.5 font-space text-[11px] uppercase tracking-wider text-black/45'>{time}</p>
    </div>
  </div>
}
