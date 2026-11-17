"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useAgencyContext } from '../AgencyContext';
import { Loader2, TriangleAlert, Upload, X } from '@/components/icons';
import { btnPrimary, btnSecondary, inputBase, modalOverlay, modalPanel } from '../ui';
import { servicesService } from '@/services/shop';
import { formatMoney } from '@/lib/money';

/* ------------------------------------------------------------------ */
/* Shared service types + helpers (used by Services + ServiceRequests) */
/* ------------------------------------------------------------------ */

export type PriceType = 'fixed' | 'starting_at' | 'hourly'

export interface ProviderService {
    id: string
    title: string
    description?: string | null
    category?: { slug: string, name: string } | null
    price: number
    priceType: PriceType
    currency?: string | null
    deliveryTime?: string | null
    location?: string | null
    image?: string | null
    isActive: boolean
    rating?: number
    reviews?: number
    requests?: number
    createdAt?: string
    updatedAt?: string
}

export const SERVICE_CATEGORIES: { slug: string, name: string }[] = [
    { slug: 'delivery', name: 'Delivery & Logistics' },
    { slug: 'design', name: 'Design & Creative' },
    { slug: 'tech', name: 'Tech & Development' },
    { slug: 'marketing', name: 'Marketing' },
    { slug: 'home', name: 'Home Services' },
    { slug: 'repairs', name: 'Repairs & Maintenance' },
    { slug: 'events', name: 'Events' },
    { slug: 'beauty', name: 'Beauty & Wellness' },
    { slug: 'education', name: 'Lessons & Tutoring' },
    { slug: 'other', name: 'Other' },
]

export const PRICE_TYPES: { value: PriceType, label: string }[] = [
    { value: 'fixed', label: 'Fixed price' },
    { value: 'starting_at', label: 'Starting at' },
    { value: 'hourly', label: 'Per hour' },
]

export function categoryName(cat?: { slug?: string, name?: string } | null) {
    if (!cat) return 'Uncategorised'
    return cat.name || SERVICE_CATEGORIES.find(c => c.slug === cat.slug)?.name || cat.slug || 'Uncategorised'
}

export function wholeMoney(amount: number | string | null | undefined, currency?: string | null) {
    const n = Number(amount)
    return formatMoney(n, currency || 'ngn', { decimals: Number.isInteger(n) ? 0 : 2 })
}

export function priceLabel(price: number | string | null | undefined, priceType?: string | null, currency?: string | null) {
    const money = wholeMoney(price, currency)
    if (priceType === 'starting_at') return `From ${money}`
    if (priceType === 'hourly') return `${money}/hr`
    return money
}


export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.') {
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
        return (err as { message: string }).message || fallback
    }
    return fallback
}

export const isMigrationError = (msg?: string | null) => !!msg && msg.includes('004_services.sql')

export function MigrationNotice() {
    return (
        <div role='alert' className='flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900'>
            <TriangleAlert size={18} className='mt-0.5 shrink-0 text-amber-600' />
            <p><span className='font-bold'>Database setup needed</span> — run <code className='rounded bg-amber-100 px-1 font-space text-xs'>backend/database/migrations/004_services.sql</code> in the Supabase SQL editor.</p>
        </div>
    )
}

/* ------------------------------------------------------------------ */

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const labelClass = 'flex flex-col gap-1.5 text-sm font-medium text-black/70'
const selectClass = `${inputBase} cursor-pointer appearance-none pr-10 bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%230c110e' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat`

interface AddServiceProps{
    setShowAddServiceModal: (show: boolean) => void
    /** When provided the modal is in edit mode */
    service?: ProviderService | null
    onSaved?: (service: ProviderService, mode: 'create' | 'edit') => void
}

interface FormState {
    title: string
    category: string
    description: string
    price: string
    priceType: PriceType
    deliveryTime: string
    location: string
    isActive: boolean
}

type FieldErrors = Partial<Record<keyof FormState | 'image', string>>

function AddNewServiceModal({setShowAddServiceModal, service, onSaved}:AddServiceProps) {
  const { handleAlert } = useAgencyContext();
  const isEdit = !!service
  const currency = service?.currency || 'ngn'
  const currencySymbol = formatMoney(0, currency, { decimals: 0 }).replace(/[\d.,\s]/g, '') || '₦'

  const [form, setForm] = useState<FormState>({
    title: service?.title ?? '',
    category: service?.category?.slug ?? '',
    description: service?.description ?? '',
    price: service ? String(service.price ?? '') : '',
    priceType: service?.priceType ?? 'fixed',
    deliveryTime: service?.deliveryTime ?? '',
    location: service?.location ?? '',
    isActive: service ? !!service.isActive : true,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(service?.image ?? null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // revoke blob previews
  useEffect(() => {
    return () => { if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview) }
  }, [preview])

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) setShowAddServiceModal(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saving, setShowAddServiceModal])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors(er => ({ ...er, image: 'Please choose an image file.' }))
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors(er => ({ ...er, image: 'Image must be 10MB or smaller.' }))
      return
    }
    setErrors(er => ({ ...er, image: undefined }))
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    if (form.title.trim().length < 3) e.title = 'Title must be at least 3 characters.'
    if (!form.category) e.category = 'Choose a category.'
    if (form.price.trim() === '') e.price = 'Enter a price.'
    else if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0) e.price = 'Price must be a number of 0 or more.'
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (saving) return
    const e = validate()
    setErrors(e)
    if (Object.values(e).some(Boolean)) return

    const fd = new FormData()
    fd.append('title', form.title.trim())
    fd.append('category', form.category)
    fd.append('description', form.description.trim())
    fd.append('price', String(Number(form.price)))
    fd.append('priceType', form.priceType)
    fd.append('currency', currency)
    fd.append('deliveryTime', form.deliveryTime.trim())
    fd.append('location', form.location.trim())
    fd.append('isActive', String(form.isActive))
    if (imageFile) fd.append('image', imageFile)

    setSaving(true)
    setApiError(null)
    try {
      const res = isEdit && service ? await servicesService.update(service.id, fd) : await servicesService.create(fd)
      const saved: ProviderService = res?.service ?? res
      onSaved?.(saved, isEdit ? 'edit' : 'create')
      handleAlert?.(isEdit ? 'Service updated!' : 'Service added!', 'good')
      setShowAddServiceModal(false)
    } catch (err) {
      setApiError(errorMessage(err, isEdit ? 'Could not update the service.' : 'Could not create the service.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`${modalOverlay} z-[60]`} onClick={(e)=>{ if (e.target === e.currentTarget && !saving) setShowAddServiceModal(false) }}>
        <form onSubmit={handleSubmit} noValidate role='dialog' aria-modal='true' aria-labelledby='service-modal-title' className={`${modalPanel} font-mont`}>
            <div className='flex items-start justify-between gap-3 border-b border-black/5 p-5 sm:px-6'>
                <div>
                    <h3 id='service-modal-title' className='text-lg font-extrabold tracking-[-0.02em] text-ink'>{isEdit ? 'Edit Service' : 'Add New Service'}</h3>
                    <p className='mt-1 text-sm text-black/55'>{isEdit ? 'Update how this service appears to buyers.' : 'List a service buyers can find and request.'}</p>
                </div>
                <button type='button' aria-label='Close' disabled={saving} onClick={()=>{setShowAddServiceModal(false)}} className='inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-cream text-ink transition-colors hover:bg-lime disabled:opacity-50'><X size={18} /></button>
            </div>

            <div className='flex flex-col gap-4 p-5 sm:px-6'>
                {apiError && (isMigrationError(apiError) ? <MigrationNotice /> : (
                    <div role='alert' className='rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700'>{apiError}</div>
                ))}

                {/* Image */}
                <div className='flex flex-col gap-1.5 text-sm font-medium text-black/70'>
                    <span>Cover image <span className='font-normal text-black/40'>(optional, max 10MB)</span></span>
                    <div className='flex items-center gap-3'>
                        <div className='flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cream ring-1 ring-black/5'>
                            {preview
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={preview} alt='Service preview' className='h-full w-full object-cover' />
                                : <Upload size={20} className='text-black/30' />}
                        </div>
                        <div className='flex flex-wrap gap-2'>
                            <button type='button' onClick={()=>fileRef.current?.click()} className={`${btnSecondary} h-10 px-4`}>{preview ? 'Change image' : 'Upload image'}</button>
                            {imageFile && <button type='button' onClick={()=>{ setImageFile(null); setPreview(service?.image ?? null) }} className='h-10 cursor-pointer rounded-full px-3 text-sm font-semibold text-black/55 hover:text-ink'>Undo</button>}
                        </div>
                        <input ref={fileRef} type='file' accept='image/*' onChange={handleFile} className='hidden' />
                    </div>
                    {errors.image && <p className='text-xs font-medium text-red-600'>{errors.image}</p>}
                </div>

                <label className={labelClass}>Title
                    <input value={form.title} onChange={(e)=>set('title', e.target.value)} type="text" placeholder='e.g. Logo & brand identity design' aria-invalid={!!errors.title} className={inputBase}/>
                    {errors.title && <span className='text-xs font-medium text-red-600'>{errors.title}</span>}
                </label>

                <label className={labelClass}>Category
                    <select value={form.category} onChange={(e)=>set('category', e.target.value)} aria-invalid={!!errors.category} className={selectClass}>
                        <option value='' disabled>Select a category</option>
                        {SERVICE_CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                    </select>
                    {errors.category && <span className='text-xs font-medium text-red-600'>{errors.category}</span>}
                </label>

                <label className={labelClass}>Description
                    <textarea value={form.description} onChange={(e)=>set('description', e.target.value)} rows={4} placeholder="Describe what's included, your process and what buyers should expect." className={`${inputBase} h-auto resize-y py-3`}/>
                </label>

                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <label className={labelClass}>Price
                        <div className='relative'>
                            <span className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-space text-sm font-bold text-black/50'>{currencySymbol}</span>
                            <input value={form.price} onChange={(e)=>set('price', e.target.value)} type="number" inputMode='decimal' min={0} step='any' placeholder='50000' aria-invalid={!!errors.price} className={`${inputBase} pl-9`}/>
                        </div>
                        {errors.price && <span className='text-xs font-medium text-red-600'>{errors.price}</span>}
                    </label>
                    <label className={labelClass}>Price type
                        <select value={form.priceType} onChange={(e)=>set('priceType', e.target.value as PriceType)} className={selectClass}>
                            {PRICE_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </label>
                </div>
                {form.price.trim() !== '' && Number(form.price) >= 0 && (
                    <p className='-mt-2 text-xs text-black/55'>Buyers will see <span className='font-space font-bold text-ink'>{priceLabel(form.price, form.priceType, currency)}</span></p>
                )}

                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <label className={labelClass}>Delivery time
                        <input value={form.deliveryTime} onChange={(e)=>set('deliveryTime', e.target.value)} type="text" placeholder='e.g. 2-3 days' className={inputBase}/>
                    </label>
                    <label className={labelClass}>Location
                        <input value={form.location} onChange={(e)=>set('location', e.target.value)} type="text" placeholder='e.g. Lagos or Remote' className={inputBase}/>
                    </label>
                </div>

                <label className='flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-cream/60 p-3.5'>
                    <span>
                        <span className='block text-sm font-semibold text-ink'>Active</span>
                        <span className='block text-xs text-black/55'>{form.isActive ? 'Visible to buyers and open to requests.' : 'Hidden from buyers until you activate it.'}</span>
                    </span>
                    <input type='checkbox' role='switch' checked={form.isActive} onChange={(e)=>set('isActive', e.target.checked)} className='peer sr-only' />
                    <span aria-hidden className='relative h-6 w-11 shrink-0 rounded-full bg-black/15 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-ink peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-lime-dark/60' />
                </label>
            </div>

            <div className='mt-auto flex flex-col-reverse gap-2 border-t border-black/5 bg-cream/50 p-4 sm:flex-row sm:justify-end sm:px-6'>
                <button type='button' disabled={saving} onClick={()=>{setShowAddServiceModal(false)}} className={btnSecondary}>Cancel</button>
                <button type='submit' disabled={saving} className={btnPrimary}>
                    {saving && <Loader2 size={16} className='animate-spin' />}
                    {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Service'}
                </button>
            </div>
        </form>
    </div>
  )
}

export default AddNewServiceModal
