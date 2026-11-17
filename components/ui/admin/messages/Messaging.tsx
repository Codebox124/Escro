"use client"
import React, { useState } from 'react'
import SearchBar from './SearchBar'
import Messages from './Messages';
import Conversation from './Conversation';
import { TbMessageDots } from '@/components/icons';

function Messaging() {
  const [selectedSomeone, setSelectedSomeone] = useState(false)
  const [conversation, setConversation] = useState({})
  return (
    <div className='surface-card flex h-full min-h-0 w-full flex-1 overflow-hidden'>
        {/* Conversation list: always visible on lg, hidden on small screens while a chat is open */}
        <div className={`${selectedSomeone ? "hidden lg:flex" : "flex"} min-h-0 w-full flex-col border-black/5 lg:w-80 lg:shrink-0 lg:border-r xl:w-96`}>
            <div className='border-b border-black/5 p-4'>
                <h1 className='mb-3 text-2xl font-extrabold tracking-[-0.03em] text-ink'>Messages</h1>
                <SearchBar setConversation={setConversation} setSelectedSomeone={setSelectedSomeone} />
            </div>
            <Messages setSelectedSomeone={setSelectedSomeone} setConversation={setConversation} />
        </div>
        {/* Conversation pane */}
        <div className={`${selectedSomeone ? "flex" : "hidden lg:flex"} min-h-0 min-w-0 flex-1 flex-col`}>
            {
             selectedSomeone ? <Conversation setConversation={setConversation} conversation={conversation} setSelectedSomeone={setSelectedSomeone} /> :
             <div className='flex flex-1 flex-col items-center justify-center gap-2 bg-cream/50 p-8 text-center'>
                <span className='flex h-14 w-14 items-center justify-center rounded-2xl bg-cream text-ink'><TbMessageDots className='text-2xl' /></span>
                <h2 className='text-lg font-extrabold tracking-[-0.02em] text-ink'>Select a conversation</h2>
                <p className='max-w-xs text-sm text-black/55'>Choose a chat from the list or search for someone to start messaging.</p>
             </div>
            }
        </div>
    </div>
  )
}

export default Messaging
