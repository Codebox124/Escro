"use client"
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAdminContext } from './AdminContext';
import { CircleAlert, LayoutDashboard, LogOut, Settings, UserRound, Users, Wallet } from '@/components/icons';
import { Logo } from '@/app/components/landing/Logo';
import { authService } from '@/services/auth'
import { ChevronRight } from '@/components/icons'

export const navItems = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Users", icon: Users },
    { label: "Disputes", icon: CircleAlert },
    { label: "Finance", icon: Wallet },
    { label: "Settings", icon: Settings },
]

const collapsedItem = 'h-11 w-11 min-h-0 justify-center gap-0 px-0'
const itemBase = 'group relative flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60'

export function Brand() {
    return (
        <div className='flex items-center gap-2.5'>
            <Logo dark />
            <span className='rounded-full bg-lime px-2 py-0.5 font-space text-[10px] font-bold uppercase tracking-widest text-ink group-data-[collapsible=icon]:hidden'>Admin</span>
        </div>
    )
}

interface SidebarNavProps {
    onNavigate?: () => void
    collapsed?: boolean
}

export function SidebarNav({ onNavigate, collapsed = false }: SidebarNavProps) {
    const {currentPage, setCurrentPage} = useAdminContext()
    return <>
        <nav className={`flex flex-1 flex-col gap-1 overflow-y-auto py-6 ${collapsed ? 'items-center px-3' : 'px-4'}`}>
            <p className={`eyebrow pb-3 font-space text-[10px] text-white/35 ${collapsed ? 'sr-only' : 'px-4'}`}>Menu</p>
            {navItems.map(({ label, icon: Icon }) => {
                const active = currentPage === label
                return (
                    <button
                        key={label}
                        type='button'
                        onClick={() => { setCurrentPage(label); onNavigate && onNavigate() }}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? label : undefined}
                        aria-label={collapsed ? label : undefined}
                        className={`${itemBase} ${collapsed ? collapsedItem : ''} ${active ? "font-bold text-ink" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                    >
                        {active && (
                            <motion.span
                                layoutId={onNavigate ? 'admin-nav-pill-mobile' : 'admin-nav-pill'}
                                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                                className='absolute inset-0 rounded-full bg-lime'
                            />
                        )}
                        <Icon size={18} className={`relative ${active ? "text-ink" : "text-white/45 group-hover:text-white"}`} />
                        {!collapsed && <span className='relative'>{label}</span>}
                    </button>
                )
            })}
        </nav>
        <div className={`mb-4 flex flex-col gap-1 rounded-3xl bg-white/5 p-2 ${collapsed ? 'mx-3 items-center' : 'mx-4'}`}>
            <button type='button' title={collapsed ? 'Profile' : undefined} aria-label='Profile' className={`${itemBase} ${collapsed ? collapsedItem : ''} text-white/60 hover:bg-white/5 hover:text-white`}><UserRound size={18} className='shrink-0 text-white/45 group-hover:text-white' />{!collapsed && ' Profile'}</button>
            <button type='button' title={collapsed ? 'Logout' : undefined} aria-label='Logout' onClick={() => authService.logout()} className={`${itemBase} ${collapsed ? collapsedItem : ''} text-white/60 hover:bg-red-500/15 hover:text-red-300`}><LogOut size={18} className='shrink-0 text-white/45 group-hover:text-red-300' />{!collapsed && ' Logout'}</button>
        </div>
    </>
}

const COLLAPSE_KEY = 'admin-sidebar-collapsed'

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    let saved = false
    try { saved = localStorage.getItem(COLLAPSE_KEY) === '1' } catch { /* ignore */ }
    if (saved) Promise.resolve().then(() => setCollapsed(true))
  }, [])

  const toggle = () => {
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1') } catch { /* ignore */ }
      return !c
    })
  }

  return (
    <aside
      data-collapsible={collapsed ? 'icon' : undefined}
      className={`group relative hidden h-dvh shrink-0 flex-col bg-ink font-mont transition-[width] duration-300 ease-out lg:flex ${collapsed ? 'w-[4.5rem]' : 'w-64'}`}
    >
        <div className={`flex h-20 shrink-0 items-center ${collapsed ? 'justify-center px-0' : 'px-6'}`}>
            <Brand />
        </div>
        <button
          type='button'
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className='absolute -right-3 top-7 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-lime text-ink shadow-md ring-2 ring-cream transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-ink'
        >
          <ChevronRight size={14} className={`transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
        </button>
        <SidebarNav collapsed={collapsed} />
    </aside>
  )
}

export default Sidebar
