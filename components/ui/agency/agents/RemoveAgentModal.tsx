"use client"
import React, { useState } from 'react'
import { Loader2, Trash2 } from '@/components/icons'
import { agencyApi } from '@/services/agency'
import { btnDanger, btnSecondary, modalOverlay, modalPanel } from '../ui'
import { Agent, LoadError, agencyError } from './shared'

interface RemoveAgentModalProps {
  agent: Agent
  onClose: () => void
  onRemoved: (courierId: string) => void
}

function RemoveAgentModal({ agent, onClose, onRemoved }: RemoveAgentModalProps) {
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove() {
    setRemoving(true)
    setError(null)
    try {
      await agencyApi.removeAgent(agent.id)
      onRemoved(agent.id)
      onClose()
    } catch (err) {
      setError(agencyError(err, 'Could not remove this agent.'))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className={`${modalOverlay} z-[60]`} onClick={() => !removing && onClose()} role='alertdialog' aria-modal='true' aria-labelledby='remove-agent-title'>
      <div onClick={(e) => e.stopPropagation()} className={modalPanel}>
        <div className='flex flex-col gap-4 p-5 sm:p-6'>
          <span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600'><Trash2 size={22} /></span>
          <div>
            <h2 id='remove-agent-title' className='text-lg font-extrabold tracking-[-0.02em] text-ink'>Remove {agent.name}?</h2>
            <p className='mt-1 text-sm text-black/55'>
              They’ll leave your team and stop showing in your stats. Their courier account stays active
              {agent.activeDeliveries > 0 ? ` and their ${agent.activeDeliveries} in-progress deliver${agent.activeDeliveries === 1 ? 'y continues' : 'ies continue'}` : ''}.
            </p>
          </div>
          {error && <LoadError error={error} />}
        </div>
        <div className='flex flex-col-reverse gap-2 border-t border-black/5 p-4 sm:flex-row sm:justify-end sm:px-6'>
          <button type='button' onClick={onClose} disabled={removing} className={btnSecondary}>Cancel</button>
          <button type='button' onClick={remove} disabled={removing} className={btnDanger}>
            {removing ? <Loader2 size={16} className='animate-spin' /> : <Trash2 size={16} />}
            {removing ? 'Removing…' : 'Remove from team'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RemoveAgentModal
