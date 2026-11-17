"use client"
import React, { useState } from 'react'
import { BsArrowLeft, BsCameraVideo } from '@/components/icons'
import { CiCamera } from '@/components/icons'
import { FaMicrophone } from '@/components/icons'
import { GiPaperClip } from '@/components/icons'
import { IoIosMore, IoMdSend } from '@/components/icons'
import { IoPersonOutline } from '@/components/icons'
import { LuPhone } from '@/components/icons'
import { TbMessageDots } from '@/components/icons'
import { useAdminContext } from '../AdminContext'





function Conversation({conversation, setSelectedSomeone, setConversation}:any) {
   const [newText, setNewText] = useState("")
   const {userInfo, setConversations, conversations} = useAdminContext()
    function handleSendMessage(){
        setNewText("")
        let newConversations
        const newMessage = {text:newText, timestamp: new Date(), sender:userInfo.userName} //create a new message
        //console.log(conversation)
        setConversation((prev:any)=>({
            ...prev,
            messages:[...prev.messages, newMessage ]
        })) //set the conversation state to include the new message

        //check if this conversation is in the conversations array
        const existingConvo = conversations.find((item:any)=>item.userName===conversation.userName)

        if(existingConvo){ //if it exists
            newConversations = conversations.map((item:any)=>{
            if(item.userName===conversation.userName){
                return {...item, messages:[...item.messages, newMessage]} //find the conversation in the array and add the new message
            }else{
                return item 
            }
         })
         setConversations(newConversations)
        }else{ //if not
            setConversations((prev:any)=> ([...prev, {...conversation, messages:[newMessage], type:"regular"}])) //add a new conversation with the new message as the only message
        }
        //console.log(newConversations)
        
    }

  return (
    <div className='flex h-full min-h-0 w-full flex-col'>
        {/* top bar*/}
        <div className='flex items-center gap-3 border-b border-black/5 px-3 py-3 sm:px-4'>
            <button type='button' aria-label='Back to conversations' onClick={()=>{setSelectedSomeone(false)}} className='inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-cream hover:text-ink'>
                <BsArrowLeft className='text-lg' />
            </button>
            <div className='flex min-w-0 cursor-pointer items-center gap-3'>
                 {
                    conversation.pfp ? <img className='h-10 w-10 shrink-0 rounded-full object-cover' src={conversation.pfp} alt={conversation.name} />:
                    <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-bold text-lime' >
                    <IoPersonOutline />
                    </span>
                }
                <div className='flex min-w-0 flex-col'>
                    <span className='truncate text-sm font-semibold text-ink'>{conversation.name}</span>
                    {conversation.type==="regular" && <span className='truncate text-xs text-black/55'>{conversation.lastSeen}</span>}
                </div>
            </div>

           {/*} <div className='flex items-center gap-5 ml-auto'>
                <LuPhone className='text-xl cursor-pointer' />
                <BsCameraVideo className='text-xl cursor-pointer' />
                <IoIosMore className='text-xl cursor-pointer' />
            </div>*/}
        </div>

        {/*middle part*/}
        <div className='flex min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto bg-cream/50 p-3 sm:p-5'>
            {
                conversation.messages.length===0 ? <NoMessages /> :
                conversation.messages.map((item: any, index: any)=>{
                    if(item.sender===conversation.userName){
                        return <div key={index} className='flex max-w-[85%] flex-col items-start gap-1 sm:max-w-[70%]'>
                        <span className='block rounded-3xl rounded-bl-md bg-white px-4 py-2.5 text-sm text-ink ring-1 ring-black/5'>{item.text}</span>
                        <span className='px-1 font-space text-[10px] text-black/40'>{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    }else{
                        return <div key={index} className='ml-auto flex max-w-[85%] flex-col items-end gap-1 sm:max-w-[70%]'>
                        <span className='block rounded-3xl rounded-br-md bg-ink px-4 py-2.5 text-sm text-white'>{item.text}</span>
                        <span className='px-1 font-space text-[10px] text-black/40'>{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    }
                })
            }
        </div>

        {/*bottom part */}
        <div className='flex w-full items-end gap-2 border-t border-black/5 p-3 sm:px-4'>
            <GiPaperClip className='hidden h-10 w-10 shrink-0 cursor-pointer rounded-full p-2.5 text-black/55 transition-colors hover:bg-cream hover:text-ink min-[400px]:block' />
            <CiCamera className='hidden h-10 w-10 shrink-0 cursor-pointer rounded-full p-2.5 text-black/55 transition-colors hover:bg-cream hover:text-ink min-[400px]:block' />
            <textarea id='messagebox' rows={1} placeholder='Type a new message...' value={newText} onChange={(e)=>{setNewText(e.target.value)}} className='h-11 min-w-0 flex-1 resize-none rounded-full border-0 bg-cream/70 px-4 py-2.5 ring-1 ring-black/5 text-sm text-ink outline-none transition placeholder:text-black/40 focus:border-ink focus:bg-white focus:ring-2 focus:ring-lime-dark/60' />
            {newText ? <IoMdSend onClick={handleSendMessage} className='h-11 w-11 shrink-0 cursor-pointer rounded-full bg-lime p-2.5 text-ink transition-colors hover:bg-lime-dark' />:<FaMicrophone className='h-11 w-11 shrink-0 cursor-pointer rounded-full bg-lime p-2.5 text-ink transition-colors hover:bg-lime-dark' />}
        </div>
    </div>
  )
}

export default Conversation

function NoMessages(){
    return <div className='flex h-full w-full flex-col items-center justify-center gap-2 text-center'>
        <span className='flex h-14 w-14 items-center justify-center rounded-2xl bg-cream text-ink'><TbMessageDots className='text-2xl' /></span>
        <h2 className='text-lg font-extrabold tracking-[-0.02em] text-ink'>No messages yet</h2>
        <p className='text-sm text-black/55'>Start the conversation</p>
    </div>
}
