"use client"
import React from 'react'
import Messaging from '../messages/Messaging'

function Messages() {
  return (
    <div className='mx-auto flex h-full min-h-[32rem] w-full max-w-[96rem] flex-col p-4 sm:p-6 lg:p-8'>
        <Messaging />
    </div>
  )
}

export default Messages
