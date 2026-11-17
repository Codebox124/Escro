"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAgencyContext } from './AgencyContext'
import { CalendarDays, Check, FolderOpen, Loader2, Mail, MessageSquare, Phone, RefreshCw, X } from '@/components/icons'
import { btnSecondary, inputBase, statusPill } from './ui'
import { servicesService } from '@/services/shop'
import { MigrationNotice, errorMessage, isMigrationError, wholeMoney } from './dashboard/AddNewServiceModal'

type RequestStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'

interface ServiceRequest {
    id: string
    status: RequestStatus
    message?: string | null
    budget?: number | null
    preferredDate?: string | null
    contactPhone?: string | null
    providerNote?: string | null
    service?: { id: string, title: string, price?: number, priceType?: string, currency?: string | null, image?: string | null } | null
    customer?: { id: string, name?: string | null, email?: string | null, phone?: string | null, avatar?: string | null } | null
    createdAt?: string
    updatedAt?: string
}

const FILTERS: { key: 'all' | RequestStatus, label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'completed', label: 'Completed' },
    { key: 'declined', label: 'Declined' },
]

function pillFor(status: RequestStatus) {
    if (status === 'accepted') return statusPill('in progress')
    if (status === 'declined') return statusPill('cancelled')
    if (status === 'cancelled') return statusPill('inactive')
    return statusPill(status)
}

function fmtDate(value?: string | null, withTime = false) {
    if (!value) return ''
    const d = new Date(value.length === 10 ? `${value}T00:00:00` : value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString('en-NG', withTime
        ? { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }
        : { day: 'numeric', month: 'short', year: 'numeric' })
}

function ServiceRequests() {
    const { handleAlert } = useAgencyContext()
    const [requests, setRequests] = useState<ServiceRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | RequestStatus>('all')

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await servicesService.incomingRequests()
            setRequests(Array.isArray(res?.requests) ? res.requests : [])
        } catch (err) {
            setError(errorMessage(err, 'Could not load service requests.'))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    const pendingCount = useMemo(() => requests.filter(r => r.status === 'pending').length, [requests])
    const visible = useMemo(() => filter === 'all' ? requests : requests.filter(r => r.status === filter), [requests, filter])

    function handleUpdated(updated: ServiceRequest) {
        setRequests(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r))
        const msg = updated.status === 'accepted' ? 'Request accepted' : updated.status === 'completed' ? 'Marked as completed' : 'Request declined'
        handleAlert?.(msg, updated.status === 'declined' ? 'bad' : 'good')
    }

    return (
        <section className='surface-card flex min-w-0 flex-col gap-4 p-4 sm:p-6' aria-labelledby='service-requests-title'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
                <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                        <h2 id='service-requests-title' className='text-lg font-extrabold tracking-[-0.02em] text-ink'>Service Requests</h2>
                        {!loading && !error && pendingCount > 0 && (
                            <span className='inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-lime px-2 font-space text-xs font-bold text-ink'>{pendingCount}</span>
                        )}
                    </div>
                    <p className='mt-0.5 text-sm text-black/55'>
                        {loading ? 'Loading requests…' : error ? 'Unable to load requests' : pendingCount > 0 ? `${pendingCount} pending ${pendingCount === 1 ? 'request needs' : 'requests need'} a response` : 'Buyers who request your services appear here.'}
                    </p>
                </div>
                {!loading && !error && (
                    <button type='button' aria-label='Refresh requests' onClick={load} className='inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-black/50 transition-colors hover:bg-cream hover:text-ink'><RefreshCw size={16} /></button>
                )}
            </div>

            {!loading && !error && requests.length > 0 && (
                <div className='-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1' role='tablist' aria-label='Filter requests'>
                    {FILTERS.map(f => {
                        const count = f.key === 'all' ? requests.length : requests.filter(r => r.status === f.key).length
                        const active = filter === f.key
                        return (
                            <button key={f.key} type='button' role='tab' aria-selected={active} onClick={()=>setFilter(f.key)}
                                className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-colors ${active ? 'bg-ink text-white' : 'bg-cream text-ink hover:bg-lime'}`}>
                                {f.label}<span className={`font-space ${active ? 'text-lime' : 'text-black/45'}`}>{count}</span>
                            </button>
                        )
                    })}
                </div>
            )}

            {loading ? (
                <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className='animate-pulse space-y-3 rounded-2xl bg-white p-4 ring-1 ring-black/5'>
                            <div className='h-3.5 w-1/2 rounded-full bg-black/5' />
                            <div className='h-3 w-1/3 rounded-full bg-black/5' />
                            <div className='h-12 rounded-xl bg-black/5' />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className='flex flex-col gap-3'>
                    {isMigrationError(error) ? <MigrationNotice /> : (
                        <div role='alert' className='rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700'>{error}</div>
                    )}
                    <button type='button' onClick={load} className={`${btnSecondary} self-start`}><RefreshCw size={16} /> Try again</button>
                </div>
            ) : visible.length === 0 ? (
                <div className='flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-cream/40 px-4 py-10 text-center text-sm text-black/55'>
                    <FolderOpen size={28} className='text-black/25' />
                    {requests.length === 0 ? 'No service requests yet.' : `No ${filter} requests.`}
                </div>
            ) : (
                <div className='grid max-h-[640px] grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2'>
                    {visible.map(r => <RequestCard key={r.id} request={r} onUpdated={handleUpdated} />)}
                </div>
            )}
        </section>
    )
}

export default ServiceRequests

function RequestCard({ request, onUpdated }: { request: ServiceRequest, onUpdated: (r: ServiceRequest) => void }) {
    const [note, setNote] = useState('')
    const [showNote, setShowNote] = useState(false)
    const [busy, setBusy] = useState<null | 'accepted' | 'declined' | 'completed'>(null)
    const [error, setError] = useState<string | null>(null)

    const customer = request.customer
    const phone = request.contactPhone || customer?.phone
    const currency = request.service?.currency || 'ngn'
    const canAct = request.status === 'pending' || request.status === 'accepted'

    async function respond(status: 'accepted' | 'declined' | 'completed') {
        setBusy(status)
        setError(null)
        try {
            const res = await servicesService.respond(request.id, status, note.trim() || undefined)
            const updated: ServiceRequest = res?.request ?? res
            onUpdated(updated && updated.id ? updated : { ...request, status, providerNote: note.trim() || request.providerNote })
            setNote('')
            setShowNote(false)
        } catch (err) {
            setError(errorMessage(err, 'Could not update this request.'))
        } finally {
            setBusy(null)
        }
    }

    return (
        <article className='flex min-w-0 flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5'>
            <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                    <p className='truncate font-semibold text-ink'>{customer?.name || 'Customer'}</p>
                    <p className='truncate text-xs text-black/55'>for <span className='font-semibold text-ink'>{request.service?.title || 'a service'}</span></p>
                </div>
                <span className={`${pillFor(request.status)} shrink-0 capitalize`}>{request.status}</span>
            </div>

            <div className='flex flex-wrap gap-1.5'>
                {customer?.email && (
                    <a href={`mailto:${customer.email}`} className='inline-flex h-8 min-w-0 max-w-full items-center gap-1.5 rounded-full bg-cream px-3 text-xs font-semibold text-ink transition-colors hover:bg-lime'>
                        <Mail size={12} className='shrink-0' /><span className='truncate'>{customer.email}</span>
                    </a>
                )}
                {phone && (
                    <a href={`tel:${phone.replace(/\s+/g, '')}`} className='inline-flex h-8 items-center gap-1.5 rounded-full bg-cream px-3 text-xs font-semibold text-ink transition-colors hover:bg-lime'>
                        <Phone size={12} />{phone}
                    </a>
                )}
            </div>

            {request.message && (
                <p className='whitespace-pre-line break-words rounded-xl bg-cream/50 p-3 text-sm text-black/75'>
                    <MessageSquare size={12} className='mr-1.5 inline text-black/40' />{request.message}
                </p>
            )}

            <dl className='grid grid-cols-2 gap-x-3 gap-y-2 text-xs'>
                <div>
                    <dt className='font-space uppercase tracking-widest text-black/45'>Budget</dt>
                    <dd className='mt-0.5 font-space font-bold text-ink'>{request.budget != null ? wholeMoney(request.budget, currency) : '—'}</dd>
                </div>
                <div>
                    <dt className='font-space uppercase tracking-widest text-black/45'>Preferred date</dt>
                    <dd className='mt-0.5 flex items-center gap-1 font-semibold text-ink'>{request.preferredDate ? <><CalendarDays size={12} />{fmtDate(request.preferredDate)}</> : '—'}</dd>
                </div>
            </dl>

            {request.providerNote && (
                <p className='text-xs text-black/55'><span className='font-bold text-ink'>Your note:</span> {request.providerNote}</p>
            )}

            {error && (isMigrationError(error) ? <MigrationNotice /> : (
                <p role='alert' className='rounded-xl bg-red-50 p-2.5 text-xs font-medium text-red-700'>{error}</p>
            ))}

            {canAct && (
                <div className='flex flex-col gap-2 border-t border-black/5 pt-3'>
                    {showNote ? (
                        <textarea value={note} onChange={(e)=>setNote(e.target.value)} rows={2} placeholder='Optional note to the customer' aria-label='Note to the customer' className={`${inputBase} h-auto resize-y py-2.5`} />
                    ) : (
                        <button type='button' onClick={()=>setShowNote(true)} className='self-start cursor-pointer text-xs font-semibold text-black/55 underline-offset-2 hover:text-ink hover:underline'>+ Add a note</button>
                    )}
                    <div className='flex flex-wrap gap-2'>
                        {request.status === 'pending' ? (
                            <ActionButton primary busy={busy === 'accepted'} disabled={!!busy} onClick={()=>respond('accepted')}><Check size={14} /> Accept</ActionButton>
                        ) : (
                            <ActionButton primary busy={busy === 'completed'} disabled={!!busy} onClick={()=>respond('completed')}><Check size={14} /> Mark completed</ActionButton>
                        )}
                        <ActionButton busy={busy === 'declined'} disabled={!!busy} onClick={()=>respond('declined')}><X size={14} /> Decline</ActionButton>
                    </div>
                </div>
            )}

            <p className='mt-auto text-[11px] text-black/40'>Received {fmtDate(request.createdAt, true)}</p>
        </article>
    )
}

function ActionButton({ children, primary, busy, disabled, onClick }: { children: React.ReactNode, primary?: boolean, busy?: boolean, disabled?: boolean, onClick: () => void }) {
    return (
        <button type='button' onClick={onClick} disabled={disabled}
            className={`inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none ${primary ? 'bg-ink text-white hover:bg-ink-soft [&_svg]:text-lime' : 'border-2 border-ink/15 text-ink hover:border-red-300 hover:text-red-700'}`}>
            {busy ? <Loader2 size={14} className='animate-spin' /> : null}
            {children}
        </button>
    )
}
