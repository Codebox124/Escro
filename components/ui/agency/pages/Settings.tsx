"use client"
import React, { useCallback, useEffect, useState } from 'react'
import GeneralSettings from '../settings/GeneralSettings';
import AccountSummary from '../settings/AccountSummary';
import PageHeader from '../PageHeader';
import { pageWrapper } from '../ui';
import { agencyApi } from '@/services/agency';
import { AgencyProfile, LoadError, agencyError } from '../agents/shared';

function SettingsSkeleton() {
  return (
    <div className='space-y-4 sm:space-y-6' aria-hidden>
      {[0, 1].map((card) => (
        <div key={card} className='surface-card animate-pulse space-y-5 p-4 sm:p-6'>
          <div className='h-5 w-40 rounded-full bg-black/5' />
          {card === 0 && <div className='h-24 w-24 rounded-2xl bg-black/5' />}
          <div className='grid gap-4 md:grid-cols-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='space-y-2'>
                <div className='h-3 w-24 rounded-full bg-black/5' />
                <div className='h-11 rounded-2xl bg-black/5' />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Settings() {
  const [profile, setProfile] = useState<AgencyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProfile(await agencyApi.profile())
    } catch (err) {
      setError(agencyError(err, 'Could not load your agency profile.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className={pageWrapper}>
        <PageHeader title='Settings' subtitle='Manage your agency profile, contact details and service areas.' />
        {loading ? (
          <SettingsSkeleton />
        ) : error || !profile ? (
          <div className='surface-card p-4 sm:p-6'>
            <LoadError error={error || 'Could not load your agency profile.'} onRetry={load} />
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start'>
            <GeneralSettings profile={profile} onSaved={setProfile} />
            <AccountSummary profile={profile} />
          </div>
        )}
    </div>
  )
}

export default Settings
