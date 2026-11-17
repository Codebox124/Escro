"use client"
import React from 'react'
import Inbox from '../messages/Inbox'

function Messages() {
  return (
    <div className='mx-auto flex h-full min-h-[32rem] w-full max-w-[96rem] flex-col p-3 sm:p-6 lg:p-8'>
      <Inbox />
    </div>
  )
}

export default Messages
