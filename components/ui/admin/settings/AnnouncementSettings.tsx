"use client"
import React, { useState } from 'react'
import { Loader2, Megaphone } from '@/components/icons'
import { PlatformNotice } from '@/components/ui/platform-banner'
import { btnPrimary, btnSecondary, inputBase, monoLabel } from '../ui'
import { InlineError, Section, SetupNotice, StatePill, Toggle } from './shared'
import { AnnouncementTone, MAX_ANNOUNCEMENT, PlatformSettings, SettingsPatch } from './types'

interface AnnouncementSettingsProps {
  settings: PlatformSettings
  available: boolean
  onSave: (patch: SettingsPatch, successMessage: string) => Promise<void>
}

const TONES: { value: AnnouncementTone; label: string; hint: string }[] = [
  { value: 'info', label: 'Info', hint: 'General news' },
  { value: 'success', label: 'Success', hint: 'Good news, launches' },
  { value: 'warning', label: 'Warning', hint: 'Delays, known issues' },
]

function AnnouncementSettings({ settings, available, onSave }: AnnouncementSettingsProps) {
  const saved = settings.announcement
  const [text, setText] = useState(saved.text || '')
  const [tone, setTone] = useState<AnnouncementTone>(saved.tone || 'info')
  const [enabled, setEnabled] = useState(!!saved.enabled)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = text.trim()
  const dirty = trimmed !== (saved.text || '').trim() || tone !== (saved.tone || 'info') || enabled !== !!saved.enabled
  const disabled = !available || saving

  async function save() {
    if (!dirty || saving) return
    if (enabled && !trimmed) { setError('Write the announcement text before turning it on.'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(
        { announcement: { enabled, text: trimmed, tone } },
        enabled ? 'Announcement is live' : 'Announcement saved (hidden)'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  function reset() {
    setText(saved.text || '')
    setTone(saved.tone || 'info')
    setEnabled(!!saved.enabled)
    setError(null)
  }

  return (
    <Section
      id='settings-announcement'
      title='Announcement banner'
      subtitle='A short message shown at the top of every dashboard.'
      icon={Megaphone}
      actions={<StatePill on={!!saved.enabled} onLabel='Live' offLabel='Hidden' tone='emerald' />}
    >
      {!available && <SetupNotice />}

      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between gap-2'>
          <label htmlFor='announcement-text' className={monoLabel}>Message</label>
          <span className={`font-space text-[11px] ${text.length >= MAX_ANNOUNCEMENT ? 'text-amber-700' : 'text-black/45'}`}>{text.length}/{MAX_ANNOUNCEMENT}</span>
        </div>
        <textarea
          id='announcement-text'
          rows={3}
          maxLength={MAX_ANNOUNCEMENT}
          value={text}
          disabled={disabled}
          placeholder='e.g. Deliveries in Lagos may be slower this weekend due to the holiday.'
          onChange={(e) => setText(e.target.value)}
          className={`${inputBase} h-auto resize-y py-3 leading-snug disabled:cursor-not-allowed disabled:opacity-60`}
        />
      </div>

      <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <fieldset className='flex min-w-0 flex-col gap-2' disabled={disabled}>
          <legend className={`${monoLabel} mb-2`}>Tone</legend>
          <div className='flex flex-wrap gap-2'>
            {TONES.map((t) => (
              <button
                key={t.value}
                type='button'
                aria-pressed={tone === t.value}
                title={t.hint}
                onClick={() => setTone(t.value)}
                className={`inline-flex h-9 cursor-pointer items-center rounded-full px-4 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${tone === t.value ? 'bg-ink text-white' : 'bg-cream text-ink hover:bg-cream-dark'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className='flex cursor-pointer items-center gap-3 text-sm font-bold text-ink'>
          <Toggle label='Show announcement' checked={enabled} disabled={disabled} onChange={setEnabled} />
          Show to users
        </label>
      </div>

      <div className='flex flex-col gap-2'>
        <p className={monoLabel}>Preview</p>
        <div className='rounded-2xl bg-app p-3 ring-1 ring-black/5'>
          {trimmed
            ? <PlatformNotice variant={tone} message={trimmed} onDismiss={() => {}} className={enabled ? '' : 'opacity-60'} />
            : <p className='px-1 py-2 text-sm text-black/45'>Start typing to see how the banner will look.</p>}
        </div>
        {trimmed && !enabled && <p className='text-xs text-black/50'>Hidden — turn on “Show to users” to publish it.</p>}
      </div>

      {error && <InlineError message={error} />}

      <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
        {dirty && <button type='button' disabled={saving} onClick={reset} className={btnSecondary}>Discard changes</button>}
        <button type='button' disabled={!available || !dirty || saving} onClick={save} className={btnPrimary}>
          {saving && <Loader2 size={16} className='animate-spin' />}Save announcement
        </button>
      </div>
    </Section>
  )
}

export default AnnouncementSettings
