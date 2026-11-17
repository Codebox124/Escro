"use client"
import React, { useState } from 'react'
import { Loader2, Truck } from '@/components/icons'
import { formatMoney } from '@/lib/money'
import { btnPrimary, btnSecondary, inputBase, monoLabel } from '../ui'
import { InlineError, Section, SetupNotice } from './shared'
import { PlatformSettings, SettingsPatch } from './types'

interface OperationsSettingsProps {
  settings: PlatformSettings
  available: boolean
  onSave: (patch: SettingsPatch, successMessage: string) => Promise<void>
}

const MAX_FEE = 1_000_000
const MAX_COMMISSION = 50
const DEFAULT_COMMISSION = 5

function OperationsSettings({ settings, available, onSave }: OperationsSettingsProps) {
  const [fee, setFee] = useState(String(settings.defaultDeliveryFee ?? ''))
  const [jobs, setJobs] = useState(String(settings.courierMaxActiveJobs ?? ''))
  const savedRate = settings.commissionRate ?? DEFAULT_COMMISSION
  const [rate, setRate] = useState(String(savedRate))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const feeNum = Number(fee)
  const jobsNum = Number(jobs)
  const rateNum = Number(rate)
  const feeError = fee.trim() === '' || !Number.isFinite(feeNum)
    ? 'Enter a delivery fee'
    : feeNum < 0 || feeNum > MAX_FEE ? `Must be between ₦0 and ${formatMoney(MAX_FEE, 'ngn', { decimals: 0 })}` : null
  const jobsError = jobs.trim() === '' || !Number.isInteger(jobsNum) || jobsNum < 1 || jobsNum > 50
    ? 'Whole number between 1 and 50'
    : null
  const rateError = rate.trim() === '' || !Number.isFinite(rateNum)
    ? 'Enter a commission rate'
    : rateNum < 0 || rateNum > MAX_COMMISSION
      ? `Must be between 0% and ${MAX_COMMISSION}%`
      : Math.round(rateNum * 2) !== rateNum * 2 ? 'Use steps of 0.5%' : null

  const patch: SettingsPatch = {}
  if (!feeError && Math.round(feeNum * 100) / 100 !== Number(settings.defaultDeliveryFee)) patch.defaultDeliveryFee = feeNum
  if (!jobsError && jobsNum !== Number(settings.courierMaxActiveJobs)) patch.courierMaxActiveJobs = jobsNum
  if (!rateError && rateNum !== Number(savedRate)) patch.commissionRate = rateNum
  const dirty = fee !== String(settings.defaultDeliveryFee ?? '') || jobs !== String(settings.courierMaxActiveJobs ?? '') || rate !== String(savedRate)
  const hasError = !!feeError || !!jobsError || !!rateError
  const disabled = !available || saving

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (saving || hasError) return
    if (Object.keys(patch).length === 0) { setError(null); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(patch, 'Operations settings saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setFee(String(settings.defaultDeliveryFee ?? ''))
    setJobs(String(settings.courierMaxActiveJobs ?? ''))
    setRate(String(savedRate))
    setError(null)
  }

  return (
    <Section
      id='settings-operations'
      title='Operations'
      subtitle='Defaults used by checkout and the courier app.'
      icon={Truck}
    >
      {!available && <SetupNotice />}
      <form onSubmit={save} noValidate className='flex flex-1 flex-col gap-5'>
        <div className='flex flex-col gap-2'>
          <label htmlFor='default-delivery-fee' className={monoLabel}>Default courier delivery fee</label>
          <div className='relative'>
            <span className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-black/50'>₦</span>
            <input
              id='default-delivery-fee'
              type='number'
              inputMode='decimal'
              min={0}
              max={MAX_FEE}
              step='50'
              value={fee}
              disabled={disabled}
              aria-invalid={!!feeError}
              aria-describedby='default-delivery-fee-help'
              onChange={(e) => setFee(e.target.value)}
              className={`${inputBase} pl-9 font-space disabled:cursor-not-allowed disabled:opacity-60 ${feeError ? 'ring-red-300' : ''}`}
            />
          </div>
          <p id='default-delivery-fee-help' className={`text-xs ${feeError ? 'font-medium text-red-700' : 'text-black/50'}`}>
            {feeError ?? `Paid to the courier when an order has no shipping fee · ${formatMoney(feeNum, 'ngn')}`}
          </p>
        </div>

        <div className='flex flex-col gap-2'>
          <label htmlFor='courier-max-jobs' className={monoLabel}>Max active jobs per courier</label>
          <input
            id='courier-max-jobs'
            type='number'
            inputMode='numeric'
            min={1}
            max={50}
            step={1}
            value={jobs}
            disabled={disabled}
            aria-invalid={!!jobsError}
            aria-describedby='courier-max-jobs-help'
            onChange={(e) => setJobs(e.target.value)}
            className={`${inputBase} font-space disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-40 ${jobsError ? 'ring-red-300' : ''}`}
          />
          <p id='courier-max-jobs-help' className={`text-xs ${jobsError ? 'font-medium text-red-700' : 'text-black/50'}`}>
            {jobsError ?? 'A courier can’t accept a new job while holding this many (1–50).'}
          </p>
        </div>

        <div className='flex flex-col gap-2'>
          <label htmlFor='commission-rate' className={monoLabel}>Escro commission (%)</label>
          <div className='relative sm:max-w-40'>
            <input
              id='commission-rate'
              type='number'
              inputMode='decimal'
              min={0}
              max={MAX_COMMISSION}
              step='0.5'
              value={rate}
              disabled={disabled}
              aria-invalid={!!rateError}
              aria-describedby='commission-rate-help'
              onChange={(e) => setRate(e.target.value)}
              className={`${inputBase} pr-9 font-space disabled:cursor-not-allowed disabled:opacity-60 ${rateError ? 'ring-red-300' : ''}`}
            />
            <span className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-black/50'>%</span>
          </div>
          <p id='commission-rate-help' className={`text-xs ${rateError ? 'font-medium text-red-700' : 'text-black/50'}`}>
            {rateError ?? `Kept from the item price when escrow is released (0–${MAX_COMMISSION}%) · On a ₦10,000 item Escro keeps ${formatMoney((10_000 * rateNum) / 100, 'ngn', { decimals: 0 })}`}
          </p>
        </div>

        {error && <InlineError message={error} />}

        <div className='mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
          {dirty && <button type='button' disabled={saving} onClick={reset} className={btnSecondary}>Discard changes</button>}
          <button type='submit' disabled={disabled || hasError || Object.keys(patch).length === 0} className={btnPrimary}>
            {saving && <Loader2 size={16} className='animate-spin' />}Save operations
          </button>
        </div>
      </form>
    </Section>
  )
}

export default OperationsSettings
