"use client"

import React, { useCallback, useEffect, useState } from 'react'
import AddNewServiceModal, { MigrationNotice, ProviderService, categoryName, errorMessage, isMigrationError, priceLabel } from './AddNewServiceModal';
import { useAgencyContext } from '../AgencyContext';
import { Clock, Edit, Layers, Loader2, MapPin, MessageSquare, Plus, RefreshCw, Trash2 } from '@/components/icons';
import { btnDanger, btnPrimary, btnSecondary, modalOverlay, modalPanel, statusPill } from '../ui';
import { servicesService } from '@/services/shop';

const iconBtn = 'inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-black/50 transition-colors hover:bg-cream hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 disabled:cursor-not-allowed disabled:opacity-40'

function Services() {
    const { handleAlert } = useAgencyContext();
    const [services, setServices] = useState<ProviderService[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<ProviderService | null>(null)
    const [serviceToDelete, setServiceToDelete] = useState<ProviderService | null>(null)
    const [togglingId, setTogglingId] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await servicesService.mine()
            setServices(Array.isArray(res?.services) ? res.services : [])
        } catch (err) {
            setError(errorMessage(err, 'Could not load your services.'))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    function openCreate() { setEditing(null); setModalOpen(true) }
    function openEdit(s: ProviderService) { setEditing(s); setModalOpen(true) }

    function handleSaved(saved: ProviderService, mode: 'create' | 'edit') {
        if (!saved || !saved.id) { load(); return }
        setServices(prev => mode === 'create' ? [saved, ...prev] : prev.map(s => s.id === saved.id ? { ...s, ...saved } : s))
    }

    async function toggleActive(s: ProviderService) {
        setTogglingId(s.id)
        try {
            const res = await servicesService.update(s.id, { isActive: !s.isActive })
            const saved: ProviderService | undefined = res?.service ?? res
            setServices(prev => prev.map(x => x.id === s.id ? { ...x, ...(saved && saved.id ? saved : {}), isActive: saved?.id ? saved.isActive : !s.isActive } : x))
            handleAlert?.(s.isActive ? 'Service paused' : 'Service activated', 'good')
        } catch (err) {
            const msg = errorMessage(err, 'Could not update the service.')
            if (isMigrationError(msg)) setError(msg)
            handleAlert?.(isMigrationError(msg) ? 'Database setup needed' : msg, 'bad')
        } finally {
            setTogglingId(null)
        }
    }

    const activeCount = services.filter(s => s.isActive).length

  return <>
  {modalOpen && <AddNewServiceModal key={editing?.id ?? 'new'} service={editing} onSaved={handleSaved} setShowAddServiceModal={(v)=>{ setModalOpen(v); if (!v) setEditing(null) }} />}
  {serviceToDelete && <DeleteServiceModal service={serviceToDelete} onClose={()=>setServiceToDelete(null)} onDeleted={(id)=>setServices(prev => prev.filter(s => s.id !== id))} />}
    <div className='surface-card flex min-w-0 flex-col gap-4 p-4 sm:p-6 lg:col-span-2'>
        <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
                <h2 className='text-lg font-extrabold tracking-[-0.02em] text-ink'>Services Offered</h2>
                <p className='mt-0.5 text-sm text-black/55'>
                    {loading ? 'Loading your services…' : error ? 'Unable to load services' : `${services.length} listed · ${activeCount} active`}
                </p>
            </div>
            {!loading && !error && services.length > 0 && (
                <button type='button' aria-label='Refresh services' onClick={load} className={iconBtn}><RefreshCw size={16} /></button>
            )}
        </div>

        <div className='flex max-h-[440px] flex-col gap-2 overflow-y-auto pr-1'>
            {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className='flex animate-pulse items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5'>
                        <div className='h-14 w-14 shrink-0 rounded-xl bg-black/5' />
                        <div className='flex-1 space-y-2'>
                            <div className='h-3.5 w-3/4 rounded-full bg-black/5' />
                            <div className='h-3 w-1/2 rounded-full bg-black/5' />
                        </div>
                    </div>
                ))
            ) : error ? (
                <div className='flex flex-col gap-3'>
                    {isMigrationError(error) ? <MigrationNotice /> : (
                        <div role='alert' className='rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700'>{error}</div>
                    )}
                    <button type='button' onClick={load} className={`${btnSecondary} self-start`}><RefreshCw size={16} /> Try again</button>
                </div>
            ) : services.length === 0 ? (
                <div className='flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/15 bg-cream/40 px-4 py-10 text-center'>
                    <Layers size={28} className='text-black/25' />
                    <div>
                        <p className='font-bold text-ink'>List your first service</p>
                        <p className='mt-1 text-sm text-black/55'>Buyers can discover and request services you add here.</p>
                    </div>
                    <button type='button' onClick={openCreate} className={btnPrimary}><Plus size={16} /> Add a service</button>
                </div>
            ) : (
                services.map((service) => (
                    <ServiceRow
                        key={service.id}
                        service={service}
                        toggling={togglingId === service.id}
                        onEdit={()=>openEdit(service)}
                        onToggle={()=>toggleActive(service)}
                        onDelete={()=>setServiceToDelete(service)}
                    />
                ))
            )}
        </div>
        {!loading && !error && services.length > 0 && (
            <button onClick={openCreate} className={`${btnPrimary} mt-auto w-full`}><Plus size={16} /> Add New Service</button>
        )}
    </div>
  </>
}

export default Services

interface ServiceRowProps{
    service: ProviderService
    toggling: boolean
    onEdit: () => void
    onToggle: () => void
    onDelete: () => void
}

function ServiceRow({service, toggling, onEdit, onToggle, onDelete}: ServiceRowProps){
    const requests = service.requests ?? 0
    return (
        <div className='flex flex-col gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5 transition-shadow hover:ring-ink/15'>
            <div className='flex items-start gap-3'>
                <div className='flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream ring-1 ring-black/5'>
                    {service.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={service.image} alt='' className='h-full w-full object-cover' />
                        : <Layers size={20} className='text-black/30' />}
                </div>
                <div className='min-w-0 flex-1'>
                    <div className='flex items-start justify-between gap-2'>
                        <p className='line-clamp-2 font-semibold leading-snug text-ink'>{service.title}</p>
                        <span className={`${statusPill(service.isActive ? 'active' : 'pending')} shrink-0`}>{service.isActive ? 'Active' : 'Paused'}</span>
                    </div>
                    <p className='mt-0.5 truncate text-xs text-black/55'>{categoryName(service.category)}</p>
                    <div className='mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-black/55'>
                        <span className='font-space font-bold text-ink'>{priceLabel(service.price, service.priceType, service.currency)}</span>
                        {service.deliveryTime && <span className='flex items-center gap-1'><Clock size={12} />{service.deliveryTime}</span>}
                        {service.location && <span className='flex items-center gap-1'><MapPin size={12} />{service.location}</span>}
                        <span className='flex items-center gap-1'><MessageSquare size={12} />{requests} {requests === 1 ? 'request' : 'requests'}</span>
                    </div>
                </div>
            </div>
            <div className='flex items-center gap-1 border-t border-black/5 pt-2'>
                <button type='button' onClick={onToggle} disabled={toggling} className='inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-cream px-3 text-xs font-bold text-ink transition-colors hover:bg-lime disabled:cursor-not-allowed disabled:opacity-50'>
                    {toggling && <Loader2 size={12} className='animate-spin' />}
                    {service.isActive ? 'Pause' : 'Activate'}
                </button>
                <button type='button' aria-label={`Edit ${service.title}`} onClick={onEdit} className={`${iconBtn} ml-auto`}><Edit size={16} /></button>
                <button type='button' aria-label={`Delete ${service.title}`} onClick={onDelete} className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}><Trash2 size={16} /></button>
            </div>
        </div>
    )
}

interface DeleteServiceProps{
    service: ProviderService
    onClose: () => void
    onDeleted: (id: string) => void
}
function DeleteServiceModal({service, onClose, onDeleted}:DeleteServiceProps){
    const { handleAlert } = useAgencyContext();
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleDeleteService(){
        setDeleting(true)
        setError(null)
        try {
            await servicesService.remove(service.id)
            onDeleted(service.id)
            handleAlert?.('Service deleted', 'bad')
            onClose()
        } catch (err) {
            setError(errorMessage(err, 'Could not delete the service.'))
        } finally {
            setDeleting(false)
        }
    }
   return <div className={`${modalOverlay} z-[60]`} onClick={(e)=>{ if (e.target === e.currentTarget && !deleting) onClose() }}>
            <div role='alertdialog' aria-modal='true' className={`${modalPanel} font-mont`}>
                <div className='p-5 sm:p-6'>
                    <h3 className='text-lg font-extrabold tracking-[-0.02em] text-ink'>Delete Service</h3>
                    <p className='mt-1 text-sm text-black/55'>Are you sure you want to delete this service? Buyers will no longer see it.</p>
                    <div className='mt-4 rounded-2xl border border-red-100 bg-red-50/60 p-4'>
                        <p className='font-semibold text-ink'>{service.title}</p>
                        <p className='text-sm text-black/55'>{priceLabel(service.price, service.priceType, service.currency)}</p>
                    </div>
                    {error && (isMigrationError(error) ? <div className='mt-3'><MigrationNotice /></div> : (
                        <p role='alert' className='mt-3 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700'>{error}</p>
                    ))}
                </div>
                <div className='flex flex-col-reverse gap-2 border-t border-black/5 bg-cream/50 p-4 sm:flex-row sm:justify-end sm:px-6'>
                    <button disabled={deleting} onClick={onClose} className={btnSecondary}>Cancel</button>
                    <button disabled={deleting} onClick={handleDeleteService} className={btnDanger}>
                        {deleting && <Loader2 size={16} className='animate-spin' />}
                        {deleting ? 'Deleting…' : 'Delete Service'}
                    </button>
                </div>
            </div>
        </div>
}
