"use client"
import { AgencyContextProvider } from '@/components/ui/agency/AgencyContext'
import Header from '@/components/ui/agency/Header'
import Dashboard from '@/components/ui/agency/pages/Dashboard'
import Sidebar from '@/components/ui/agency/Sidebar'
import View from '@/components/ui/agency/View'
import AgencyBottomNav from '@/components/ui/agency/BottomNav'
import React from 'react'
import PlatformBanner from '@/components/ui/platform-banner'

function page() {
  
  return (
    <AgencyContextProvider>
      <div className='flex h-dvh w-full overflow-hidden bg-app font-mont text-ink'>
        <Sidebar />
        <div className='flex min-w-0 flex-1 flex-col'>
          <Header />
          <PlatformBanner audience="agency" />
          <main className='pb-bottom-nav min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden'>
            <View />
          </main>
        </div>
        <AgencyBottomNav />
      </div>
    </AgencyContextProvider>
  )
}

export default page
