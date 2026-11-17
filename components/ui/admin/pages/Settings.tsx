"use client"
import React, { useCallback, useEffect, useState } from 'react'
import { Power } from '@/components/icons'
import { adminSettingsApi } from '@/services/admin'
import { PLATFORM_STATUS_EVENT } from '@/components/ui/platform-banner'
import PageHeader from '../PageHeader'
import { useAdminContext } from '../AdminContext'
import { pageWrapper } from '../ui'
import { errorMessage } from '../users/types'
import SystemHealth from '../settings/SystemHealth'
import PlatformControls from '../settings/PlatformControls'
import AnnouncementSettings from '../settings/AnnouncementSettings'
import OperationsSettings from '../settings/OperationsSettings'
import AuditLog from '../settings/AuditLog'
import AccountSettings from '../settings/AccountSettings'
import { LoadError, Section, SkeletonRows } from '../settings/shared'
import { PlatformHealth, SettingsPatch, SettingsResponse } from '../settings/types'

function Settings() {
  const { handleAlert } = useAdminContext()

  // --- health ---
  const [healthKey, setHealthKey] = useState(0)
  const [health, setHealth] = useState<{ key: number; data: PlatformHealth } | null>(null)
  const [healthError, setHealthError] = useState<{ key: number; message: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    adminSettingsApi.health()
      .then((data: PlatformHealth) => { if (!cancelled) setHealth({ key: healthKey, data }) })
      .catch((err: unknown) => { if (!cancelled) setHealthError({ key: healthKey, message: errorMessage(err, "Couldn't run health checks.") }) })
    return () => { cancelled = true }
  }, [healthKey])

  const healthLoading = health?.key !== healthKey && healthError?.key !== healthKey
  const healthErr = healthError?.key === healthKey ? healthError.message : null

  // --- settings ---
  const [settingsKey, setSettingsKey] = useState(0)
  const [settings, setSettings] = useState<{ key: number; data: SettingsResponse } | null>(null)
  const [settingsError, setSettingsError] = useState<{ key: number; message: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    adminSettingsApi.get()
      .then((data: SettingsResponse) => { if (!cancelled) setSettings({ key: settingsKey, data }) })
      .catch((err: unknown) => { if (!cancelled) setSettingsError({ key: settingsKey, message: errorMessage(err, "Couldn't load platform settings.") }) })
    return () => { cancelled = true }
  }, [settingsKey])

  const settingsErr = settingsError?.key === settingsKey ? settingsError.message : null
  const current = settings?.data

  const [saveCount, setSaveCount] = useState(0)

  const save = useCallback(async (patch: SettingsPatch, successMessage: string) => {
    try {
      const data: SettingsResponse = await adminSettingsApi.update(patch)
      setSettings((prev) => ({ key: prev?.key ?? 0, data }))
      setSaveCount((n) => n + 1)
      handleAlert(successMessage, 'good')
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(PLATFORM_STATUS_EVENT))
    } catch (err) {
      throw new Error(errorMessage(err, "Couldn't save settings."))
    }
  }, [handleAlert])

  return (
    <div className={pageWrapper}>
      <PageHeader title='Settings' subtitle='Platform health, live controls, announcements and your admin account.' />

      <SystemHealth
        health={health?.data ?? null}
        loading={healthLoading}
        error={healthErr}
        onRefresh={() => setHealthKey((k) => k + 1)}
      />

      {!current ? (
        <Section id='settings-controls' title='Platform controls' subtitle='Switches that change what users can do right now.' icon={Power}>
          {settingsErr
            ? <LoadError message={settingsErr} onRetry={() => setSettingsKey((k) => k + 1)} />
            : <SkeletonRows rows={3} label='Loading platform settings' />}
        </Section>
      ) : (
        <>
          <PlatformControls settings={current.settings} available={current.available} onSave={save} />
          <div className='grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-2'>
            <AnnouncementSettings
              key={JSON.stringify(current.settings.announcement)}
              settings={current.settings}
              available={current.available}
              onSave={save}
            />
            <OperationsSettings
              key={`${current.settings.defaultDeliveryFee}:${current.settings.courierMaxActiveJobs}:${current.settings.commissionRate}`}
              settings={current.settings}
              available={current.available}
              onSave={save}
            />
          </div>
        </>
      )}

      <AuditLog refreshSignal={saveCount} />
      <AccountSettings />
    </div>
  )
}

export default Settings
