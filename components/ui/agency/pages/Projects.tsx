"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FolderOpen, RefreshCw, Search } from '@/components/icons'
import { servicesService } from '@/services/shop'
import { errorText } from '@/components/ui/chat/chat'
import { ChatNotice } from '@/components/ui/chat/ChatParts'
import { useAgencyContext } from '../AgencyContext'
import PageHeader from '../PageHeader'
import { btnSecondary, pageWrapper } from '../ui'
import Stats from '../projects/Stats'
import FilterOptions from '../projects/FilterOptions'
import Projs from '../projects/Projs'
import RequestDetails from '../projects/RequestDetails'
import RespondModal from '../projects/RespondModal'
import {
  ACTION_LABEL,
  FILTERS,
  bucketOf,
  openThreadLater,
  type ProjectFilter,
  type ServiceRequest,
  type Transition,
} from '../projects/types'

type LoadState = { key: number; requests: ServiceRequest[]; error: string | null }

const DONE_ALERT: Record<Transition, [string, string]> = {
  accepted: ['Request accepted', 'good'],
  declined: ['Request declined', 'bad'],
  completed: ['Marked as completed', 'good'],
}

function Projects() {
  const { setCurrentPage, handleAlert } = useAgencyContext()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<LoadState>({ key: -1, requests: [], error: null })
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<ProjectFilter>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<{ request: ServiceRequest; transition: Transition } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const loading = state.key !== attempt

  useEffect(() => {
    let cancelled = false
    servicesService
      .incomingRequests()
      .then((res: { requests?: ServiceRequest[] }) => {
        if (!cancelled) setState({ key: attempt, requests: res?.requests ?? [], error: null })
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ key: attempt, requests: [], error: errorText(e, "Couldn't load your projects") })
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false)
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = () => {
    setRefreshing(true)
    setAttempt((a) => a + 1)
  }

  const counts = useMemo(() => {
    const c: Record<ProjectFilter, number> = { all: state.requests.length, pending: 0, accepted: 0, completed: 0, declined: 0 }
    state.requests.forEach((r) => {
      c[bucketOf(r.status)] += 1
    })
    return c
  }, [state.requests])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return state.requests.filter((r) => {
      if (filter !== 'all' && bucketOf(r.status) !== filter) return false
      if (!q) return true
      return [r.customer?.name, r.customer?.email, r.service?.title, r.message]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [state.requests, filter, search])

  const selected = selectedId ? state.requests.find((r) => r.id === selectedId) ?? null : null

  const startAction = (request: ServiceRequest, transition: Transition) => {
    setActionError(null)
    setPendingAction({ request, transition })
  }

  const closeAction = useCallback(() => {
    setPendingAction(null)
    setActionError(null)
  }, [])

  const closeDetails = useCallback(() => setSelectedId(null), [])

  const confirmAction = async (note: string) => {
    if (!pendingAction) return
    const { request, transition } = pendingAction
    setBusyId(request.id)
    setActionError(null)
    try {
      const updated = (await servicesService.respond(request.id, transition, note.trim())) as ServiceRequest | null
      setState((prev) => ({
        ...prev,
        requests: prev.requests.map((r) =>
          r.id === request.id
            ? { ...r, ...(updated && typeof updated === 'object' && 'id' in updated ? updated : {}), status: transition, providerNote: updated?.providerNote ?? (note.trim() || null) }
            : r
        ),
      }))
      setPendingAction(null)
      const [title, type] = DONE_ALERT[transition]
      handleAlert?.(title, type)
    } catch (e) {
      setActionError(errorText(e, `Couldn't ${ACTION_LABEL[transition].toLowerCase()} this request`))
    } finally {
      setBusyId(null)
    }
  }

  const openMessages = (r: ServiceRequest) => {
    openThreadLater(r.id)
    setCurrentPage('Messages')
  }

  const filterLabel = FILTERS.find((f) => f.value === filter)?.label ?? 'All'

  return (
    <>
      <AnimatePresence>
        {selected && (
          <RequestDetails
            key={selected.id}
            request={selected}
            busy={busyId === selected.id}
            blocked={!!pendingAction}
            onClose={closeDetails}
            onAction={startAction}
            onMessage={openMessages}
          />
        )}
      </AnimatePresence>
      {pendingAction && (
        <RespondModal
          request={pendingAction.request}
          transition={pendingAction.transition}
          busy={busyId === pendingAction.request.id}
          error={actionError}
          onClose={closeAction}
          onConfirm={confirmAction}
        />
      )}

      <div className={pageWrapper}>
        <PageHeader
          title='Projects'
          subtitle='Service requests from customers — accept, deliver and keep the conversation going.'
          actions={
            <button type='button' onClick={reload} disabled={loading || refreshing} className={`${btnSecondary} w-full sm:w-auto`}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden='true' />
              Refresh
            </button>
          }
        />

        {state.error && !loading ? (
          <ChatNotice title="Couldn't load your projects" message={state.error} onRetry={reload} />
        ) : (
          <>
            <Stats requests={state.requests} loading={loading} />
            <FilterOptions filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} counts={counts} />

            {loading ? (
              <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3' aria-busy='true' aria-label='Loading projects'>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className='surface-card flex animate-pulse flex-col gap-4 p-5'>
                    <div className='flex gap-3'>
                      <div className='h-14 w-14 rounded-2xl bg-cream' />
                      <div className='flex-1 space-y-2.5'>
                        <div className='h-4 w-2/3 rounded-full bg-black/5' />
                        <div className='h-3 w-1/3 rounded-full bg-black/5' />
                      </div>
                    </div>
                    <div className='h-3 w-full rounded-full bg-black/5' />
                    <div className='h-3 w-4/5 rounded-full bg-black/5' />
                    <div className='h-10 w-1/2 rounded-full bg-black/5' />
                  </div>
                ))}
              </div>
            ) : visible.length === 0 ? (
              <div className='surface-card flex flex-col items-center px-6 py-14 text-center'>
                <span className='flex h-14 w-14 items-center justify-center rounded-2xl bg-lime text-ink'>
                  {state.requests.length === 0 ? <FolderOpen className='h-7 w-7' /> : <Search className='h-7 w-7' />}
                </span>
                <h2 className='mt-4 text-lg font-extrabold tracking-tight text-ink'>
                  {state.requests.length === 0 ? 'No projects yet' : 'No matching projects'}
                </h2>
                <p className='mt-1 max-w-md text-sm text-black/55'>
                  {state.requests.length === 0
                    ? 'When customers request one of your services, it shows up here as a project.'
                    : `Nothing in “${filterLabel}”${search.trim() ? ` matches “${search.trim()}”` : ''}.`}
                </p>
                {state.requests.length > 0 && (
                  <button
                    type='button'
                    onClick={() => {
                      setFilter('all')
                      setSearch('')
                    }}
                    className={`${btnSecondary} mt-5`}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <Projs
                requests={visible}
                busyId={busyId}
                onOpen={(r) => setSelectedId(r.id)}
                onAction={startAction}
                onMessage={openMessages}
              />
            )}
          </>
        )}
      </div>
    </>
  )
}

export default Projects
