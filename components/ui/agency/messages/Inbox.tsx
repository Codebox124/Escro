"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Search, TbMessageDots, X } from '@/components/icons'
import { messagesApi } from '@/services/agency'
import ChatConversation from '@/components/ui/chat/ChatConversation'
import { ChatAvatar, ChatNotice } from '@/components/ui/chat/ChatParts'
import { type ChatThread, type RequestStatus, errorText } from '@/components/ui/chat/chat'
import { btnGhostIcon, searchInput } from '../ui'
import { clearPendingThread, peekPendingThread, requestPill, statusLabel } from '../projects/types'
import ThreadList from './ThreadList'

const POLL_MS = 10_000

type LoadState = { key: number; threads: ChatThread[]; error: string | null }

function Inbox() {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<LoadState>({ key: -1, threads: [], error: null })
  const [selectedId, setSelectedId] = useState<string | null>(() => peekPendingThread())
  const [search, setSearch] = useState('')

  // The hand-off from Projects has been consumed.
  useEffect(() => {
    clearPendingThread()
  }, [])

  const loading = state.key !== attempt

  useEffect(() => {
    let cancelled = false
    messagesApi
      .threads()
      .then((res: { threads?: ChatThread[] }) => {
        if (!cancelled) setState({ key: attempt, threads: res?.threads ?? [], error: null })
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ key: attempt, threads: [], error: errorText(e, "Couldn't load your messages") })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  /** Silent refresh (keeps the current list on failure). */
  const refreshThreads = useCallback(() => {
    messagesApi
      .threads()
      .then((res: { threads?: ChatThread[] }) => {
        setState((prev) => (prev.error ? prev : { ...prev, threads: res?.threads ?? prev.threads }))
      })
      .catch(() => {})
  }, [])

  // Keep unread counts / previews fresh
  useEffect(() => {
    if (state.error) return
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') refreshThreads()
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [refreshThreads, state.error])

  const select = (t: ChatThread) => {
    setSelectedId(t.requestId)
    // Opening a thread marks its messages read.
    setState((prev) => ({ ...prev, threads: prev.threads.map((x) => (x.requestId === t.requestId ? { ...x, unread: 0 } : x)) }))
  }

  const onStatusChange = useCallback((requestId: string, status: RequestStatus) => {
    setState((prev) => ({ ...prev, threads: prev.threads.map((x) => (x.requestId === requestId ? { ...x, status } : x)) }))
  }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return state.threads
    return state.threads.filter((t) =>
      [t.other?.name, t.service?.title, t.lastMessage?.body, t.opener?.body]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  }, [state.threads, search])

  const selected = selectedId ? state.threads.find((t) => t.requestId === selectedId) ?? null : null
  const totalUnread = state.threads.reduce((n, t) => n + (t.requestId === selectedId ? 0 : t.unread || 0), 0)

  return (
    <div className='surface-card flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden'>
      {/* Thread list: always on lg; hidden on small screens while a chat is open */}
      <section
        aria-label='Conversations'
        className={`${selectedId ? 'hidden lg:flex' : 'flex'} min-h-0 w-full min-w-0 flex-col border-black/5 lg:w-80 lg:shrink-0 lg:border-r xl:w-96`}
      >
        <div className='border-b border-black/5 p-4'>
          <div className='mb-3 flex items-center justify-between gap-2'>
            <h1 className='text-2xl font-extrabold tracking-[-0.03em] text-ink'>Messages</h1>
            {totalUnread > 0 && (
              <span className='rounded-full bg-lime px-2.5 py-1 font-space text-xs font-bold text-ink'>{totalUnread} unread</span>
            )}
          </div>
          <div className='relative'>
            <label htmlFor='threads-search' className='sr-only'>Search conversations</label>
            <Search className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40' />
            <input
              id='threads-search'
              type='search'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search name or service…'
              className={`${searchInput} bg-cream pl-10 pr-10 ring-0`}
            />
            {search && (
              <button
                type='button'
                onClick={() => setSearch('')}
                aria-label='Clear search'
                className='absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-black/50 hover:bg-white hover:text-ink'
              >
                <X className='h-4 w-4' />
              </button>
            )}
          </div>
        </div>
        <div className='min-h-0 flex-1 overflow-y-auto'>
          {loading ? (
            <div aria-busy='true' aria-label='Loading conversations'>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className='flex animate-pulse gap-3 border-b border-black/5 px-4 py-4'>
                  <div className='h-11 w-11 shrink-0 rounded-full bg-cream' />
                  <div className='flex-1 space-y-2'>
                    <div className='h-3.5 w-1/2 rounded-full bg-black/5' />
                    <div className='h-3 w-2/3 rounded-full bg-black/5' />
                    <div className='h-3 w-4/5 rounded-full bg-black/5' />
                  </div>
                </div>
              ))}
            </div>
          ) : state.error ? (
            <div className='p-3'>
              <ChatNotice compact title="Couldn't load your messages" message={state.error} onRetry={() => setAttempt((a) => a + 1)} />
            </div>
          ) : visible.length === 0 ? (
            <div className='flex flex-col items-center gap-2 px-6 py-12 text-center'>
              <span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-cream text-ink'>
                <TbMessageDots className='h-6 w-6' />
              </span>
              <p className='font-bold text-ink'>{state.threads.length ? 'No matches' : 'No conversations yet'}</p>
              <p className='max-w-xs text-sm text-black/55'>
                {state.threads.length
                  ? 'Try a different name or service.'
                  : 'Each service request from a customer starts a conversation here.'}
              </p>
            </div>
          ) : (
            <ThreadList threads={visible} selectedId={selectedId} onSelect={select} />
          )}
        </div>
      </section>

      {/* Conversation pane */}
      <section
        aria-label='Conversation'
        className={`${selectedId ? 'flex' : 'hidden lg:flex'} min-h-0 min-w-0 flex-1 flex-col`}
      >
        {selectedId ? (
          <ChatConversation
            requestId={selectedId}
            opener={selected?.opener ?? null}
            openerMine={selected?.me === 'customer'}
            otherName={selected?.other?.name}
            status={selected?.status ?? null}
            onStatusChange={(s) => onStatusChange(selectedId, s)}
            onActivity={refreshThreads}
            header={
              <header className='flex min-w-0 items-center gap-3 border-b border-black/5 bg-white px-3 py-3 sm:px-4'>
                <button type='button' onClick={() => setSelectedId(null)} aria-label='Back to conversations' className={`${btnGhostIcon} -ml-1 lg:hidden`}>
                  <ArrowLeft className='h-5 w-5' />
                </button>
                <ChatAvatar name={selected?.other?.name} avatar={selected?.other?.avatar} className='h-10 w-10 text-xs' />
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-extrabold text-ink'>{selected?.other?.name || (loading ? 'Loading…' : 'Customer')}</p>
                  <p className='truncate text-xs text-black/55'>{selected?.service?.title ?? 'Service request'}</p>
                </div>
                {selected && <span className={`${requestPill(selected.status)} hidden min-[400px]:inline-flex`}>{statusLabel(selected.status)}</span>}
              </header>
            }
          />
        ) : (
          <div className='flex flex-1 flex-col items-center justify-center gap-2 bg-cream/50 p-8 text-center'>
            <span className='flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-ink ring-1 ring-black/5'>
              <TbMessageDots className='h-7 w-7' />
            </span>
            <h2 className='text-lg font-extrabold tracking-[-0.02em] text-ink'>Select a conversation</h2>
            <p className='max-w-xs text-sm text-black/55'>Pick a customer from the list to read and reply to their messages.</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default Inbox
