"use client"
import React, { useEffect } from 'react'
import { AdminContextProvider, useAdminContext } from './AdminContext'
import Header from './Header'
import Sidebar from './Sidebar'
import View from './View'
import AdminBottomNav from './BottomNav'
import PlatformBanner from '@/components/ui/platform-banner'

/** Keep the address bar in step with the open page so links can be shared and bookmarked. */
function UrlSync() {
  const { currentPage } = useAdminContext()
  useEffect(() => {
    if (!currentPage) return
    const target = currentPage === 'Dashboard' ? '/admin' : `/admin/${String(currentPage).toLowerCase()}`
    if (window.location.pathname !== target) window.history.replaceState(window.history.state, '', target)
  }, [currentPage])
  return null
}

export default function AdminApp({ initialPage }: { initialPage?: string }) {
  return (
    <AdminContextProvider initialPage={initialPage}>
      <UrlSync />
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
