"use client"
import React from 'react'
import {AnimatePresence} from "framer-motion"
import { Bell, LogOut, Settings } from '@/components/icons'
import { authService } from '@/services/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAdminContext } from './AdminContext'
import FloatingCard from './notifications/FloatingCard'
import { Logo } from '@/app/components/landing/Logo'

const roundBtn = 'relative inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60'

function Header() {
  const {showNotifications, setShowNotifications, currentPage, setCurrentPage} = useAdminContext()
  return <>
  <AnimatePresence>
    {showNotifications && <FloatingCard />}
  </AnimatePresence>
    <header className='sticky top-0 z-30 flex h-16 w-full shrink-0 items-center gap-3 border-b border-black/5 bg-cream/80 px-4 font-mont backdrop-blur-xl sm:h-20 sm:px-6 lg:px-8'>
        <span className='sm:hidden'><Logo /></span>
        <div className='hidden min-w-0 items-center gap-2 sm:flex'>
            <span className='eyebrow font-space text-[11px] text-black/40'>Admin</span>
            <span className='text-black/20'>/</span>
            <span className='truncate text-sm font-extrabold tracking-tight text-ink'>{currentPage || "Dashboard"}</span>
        </div>
        <div className='ml-auto flex items-center gap-2 sm:gap-3'>
            <button type='button' aria-label='Notifications' onClick={()=>{setShowNotifications(!showNotifications)}} className={`${roundBtn} ring-1 ring-black/5 ${showNotifications ? "bg-ink text-lime" : "bg-white text-ink hover:bg-lime"}`}>
                <Bell size={19} />
                <span className='absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white' />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <button type='button' aria-label='Account menu' className='flex cursor-pointer items-center gap-2.5 rounded-full bg-white p-1 pr-1 ring-1 ring-black/5 transition-colors hover:ring-black/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 md:pr-4'>
                  <span className='flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-lime'>A</span>
                  <div className='hidden flex-col leading-tight md:flex'>
                      <span className='text-sm font-bold text-ink'>Admin</span>
                      <span className='font-space text-[10px] uppercase tracking-wider text-black/45'>Platform owner</span>
                  </div>
              </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='mt-2 w-56 rounded-3xl border-0 bg-white p-2 font-mont shadow-2xl shadow-black/10 ring-1 ring-black/5'>
                <div className='rounded-2xl bg-cream px-3 py-2.5'>
                  <p className='text-sm font-bold text-ink'>Admin</p>
                  <p className='font-space text-[10px] uppercase tracking-wider text-black/45'>Platform owner</p>
                </div>
                <DropdownMenuSeparator className='my-2 bg-black/5' />
                <DropdownMenuItem onClick={() => setCurrentPage('Settings')} className='cursor-pointer rounded-xl px-2.5 py-2.5 focus:bg-cream focus:text-ink'>
                  <Settings size={16} /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => authService.logout()} className='cursor-pointer rounded-xl px-2.5 py-2.5 text-red-600 focus:bg-red-50 focus:text-red-700'>
                  <LogOut size={16} /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </header>
  </>
}

export default Header
