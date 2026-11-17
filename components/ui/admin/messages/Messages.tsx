"use client"
import React, { useEffect, useState } from 'react'
import { TbMessageDots } from "@/components/icons";
import { TbMessagePlus } from "@/components/icons";
import { IoPersonOutline } from '@/components/icons';
//import CreateGroupModal from './CreateGroupModal';
import { useAdminContext } from '../AdminContext';

function Messages({setSelectedSomeone, setConversation}:any) {
    const {conversations, setConversations} = useAdminContext()
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  return <>
  {/*showCreateGroupModal && <CreateGroupModal setShowCreateGroupModal={setShowCreateGroupModal} />*/}
    <div className='flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2'>
        {conversations.length===0 ? <NoMessages />:
        conversations.map((item: any, index: any)=>{
          return <div onClick={()=>{setSelectedSomeone(true); setConversation(item)}} className='flex w-full cursor-pointer items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-cream' key={item.id}>
            { item.type==="regular" &&
              item.pfp ? <img className='h-11 w-11 shrink-0 rounded-full object-cover' src={item.pfp} alt={item.name} />:
              <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink font-bold text-lime' >
              <IoPersonOutline />
              </span>
            }
              <div className='flex min-w-0 flex-1 flex-col'>
                    <div className='flex items-baseline justify-between gap-2'>
                        <span className='truncate text-sm font-semibold text-ink'>{item.name}</span>
                        <span className='shrink-0 font-space text-[11px] text-black/40'>{new Date(item.messages[item.messages.length-1].timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                    </div>
                    <span className='truncate text-sm text-black/55'>{item.messages[item.messages.length - 1].text.substring(0, 10)}...</span>
                </div>
          </div>
        })
        }


       {/*<TbMessagePlus onClick={()=>{setShowCreateGroupModal(true)}} className='absolute right-10 bottom-10 text-5xl bg-emerald-700 text-white p-3 rounded-full cursor-pointer'/>*/}
    </div>
  </>
}

export default Messages

function NoMessages(){
    return <div className='flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center'>
        <span className='flex h-14 w-14 items-center justify-center rounded-2xl bg-cream text-ink'><TbMessageDots className='text-2xl' /></span>
        <h2 className='text-lg font-extrabold tracking-[-0.02em] text-ink'>No conversations yet</h2>
        <p className='text-sm text-black/55'>Start chatting by searching for users or create a group</p>
    </div>
}
