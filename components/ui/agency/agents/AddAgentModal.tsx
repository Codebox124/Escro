"use client"
import React, { useState } from 'react'
import { Loader2, Mail, UserPlus, X } from '@/components/icons'
import { agencyApi } from '@/services/agency'
import { btnPrimary, btnSecondary, cardSubtitle, cardTitle, inputBase, modalOverlay, modalPanel } from '../ui'
import { Agent, LoadError, agencyError } from './shared'

interface AddAgentModalProps {
  onClose: () => void
  onAdded: (agent: Agent) => void
}

function AddAgentModal({ onClose, onAdded }: AddAgentModalProps) {
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const value = email.trim()
    if (!value) { setError('Enter the courier’s email address.'); return }
    setSaving(true)
    setError(null)
    try {
      const agent = await agencyApi.addAgent(value)
      onAdded(agent)
      onClose()
    } catch (err) {
      setError(agencyError(err, 'Could not add that agent.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={modalOverlay} onClick={() => !saving && onClose()} role='dialog' aria-modal='true' aria-labelledby='add-agent-title'>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className={modalPanel}>
        <div className='flex items-start justify-between gap-3 border-b border-black/5 p-5 sm:px-6'>
          <div className='min-w-0'>
            <h2 id='add-agent-title' className={cardTitle}>Add an agent</h2>
            <p className={cardSubtitle}>Add an existing Escro courier to your team by their account email.</p>
          </div>
          <button type='button' aria-label='Close' onClick={onClose} disabled={saving} className='inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-cream text-ink transition-colors hover:bg-lime disabled:opacity-50'><X size={18} /></button>
        </div>
        <div className='flex flex-col gap-4 p-5 sm:p-6'>
          <label className='flex flex-col gap-1.5 text-sm font-medium text-black/70'>
            Courier email
            <span className='relative'>
              <Mail size={16} className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/40' />
              <input
                type='email'
                autoFocus
                required
                autoComplete='off'
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(null) }}
                placeholder='rider@example.com'
                className={`${inputBase} pl-10`}
              />
            </span>
          </label>
          <p className='text-xs text-black/50'>They need a courier account first — ask them to sign up as a courier on Escro if they haven’t.</p>
          {error && <LoadError error={error} />}
        </div>
        <div className='flex flex-col-reverse gap-2 border-t border-black/5 p-4 sm:flex-row sm:justify-end sm:px-6'>
          <button type='button' onClick={onClose} disabled={saving} className={btnSecondary}>Cancel</button>
          <button type='submit' disabled={saving || !email.trim()} className={btnPrimary}>
            {saving ? <Loader2 size={16} className='animate-spin' /> : <UserPlus size={16} />}
            {saving ? 'Adding…' : 'Add to team'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddAgentModal
