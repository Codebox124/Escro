"use client"
import { AdminContextProvider } from '@/components/ui/admin/AdminContext'
import Header from '@/components/ui/admin/Header'
import Dashboard from '@/components/ui/admin/pages/Dashboard'
import Sidebar from '@/components/ui/admin/Sidebar'
import View from '@/components/ui/admin/View'
import AdminBottomNav from '@/components/ui/admin/BottomNav'
import React from 'react'
import PlatformBanner from '@/components/ui/platform-banner'

function page() {
  
  return (
    <AdminContextProvider>
      <div className='flex h-dvh w-full overflow-hidden bg-app font-mont text-ink'>
        <Sidebar />
        <div className='flex min-w-0 flex-1 flex-col'>
          <Header />
          <PlatformBanner audience="admin" />
          <main className='pb-bottom-nav min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden'>
            <View />
          </main>
        </div>
        <AdminBottomNav />
      </div>
    </AdminContextProvider>
  )
}

export default page
