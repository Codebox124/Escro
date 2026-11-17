"use client"
import React from 'react'
import { type ChatThread, shortTime } from '@/components/ui/chat/chat'
import { ChatAvatar } from '@/components/ui/chat/ChatParts'
import { requestPill, statusLabel } from '../projects/types'

interface Props {
  threads: ChatThread[]
  selectedId: string | null
  onSelect: (t: ChatThread) => void
}

export function threadPreview(t: ChatThread) {
  if (t.lastMessage) return `${t.lastMessage.mine ? 'You: ' : ''}${t.lastMessage.body}`
  if (t.opener?.body) return `${t.me === 'customer' ? 'You: ' : ''}${t.opener.body}`
  return 'No messages yet'
}

function ThreadList({ threads, selectedId, onSelect }: Props) {
  return (
    <ul className='flex flex-col' aria-label='Conversations'>
      {threads.map((t) => {
        const active = t.requestId === selectedId
        const unread = active ? 0 : t.unread || 0
        const time = t.lastMessage?.createdAt ?? t.opener?.createdAt ?? t.updatedAt
        const name = t.other?.name || (t.me === 'provider' ? 'Customer' : 'Provider')
        return (
          <li key={t.requestId}>
            <button
              type='button'
              onClick={() => onSelect(t)}
              aria-current={active ? 'true' : undefined}
              aria-label={`${name}, ${t.service?.title ?? 'service request'}${unread ? `, ${unread} unread` : ''}`}
              className={`flex w-full min-w-0 cursor-pointer items-start gap-3 border-b border-black/5 px-4 py-3.5 text-left transition-colors focus-visible:bg-cream focus-visible:outline-none ${
                active ? 'bg-cream' : 'hover:bg-cream/60'
              }`}
            >
              <span className='relative'>
                <ChatAvatar name={name} avatar={t.other?.avatar} className='h-11 w-11 text-xs' />
                {unread > 0 && <span className='absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-lime ring-2 ring-white' aria-hidden='true' />}
              </span>
              <span className='min-w-0 flex-1'>
                <span className='flex min-w-0 items-baseline justify-between gap-2'>
                  <span className={`min-w-0 truncate text-sm text-ink ${unread ? 'font-extrabold' : 'font-bold'}`}>{name}</span>
                  <span className={`shrink-0 font-space text-[11px] ${unread ? 'font-bold text-emerald-700' : 'text-black/45'}`}>{shortTime(time)}</span>
                </span>
                <span className='mt-0.5 block truncate text-xs font-semibold text-black/55'>{t.service?.title ?? 'Service request'}</span>
                <span className='mt-1 flex min-w-0 items-center justify-between gap-2'>
                  <span className={`min-w-0 truncate text-xs ${unread ? 'font-semibold text-ink' : 'text-black/50'}`}>{threadPreview(t)}</span>
                  {unread > 0 && (
                    <span className='inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-ink px-1.5 font-space text-[10px] font-bold text-lime'>
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </span>
                <span className={`${requestPill(t.status)} mt-2 py-0.5 text-[10px]`}>{statusLabel(t.status)}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default ThreadList
