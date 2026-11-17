"use client"
import React from 'react'
import {motion} from 'framer-motion'
import { menuAnimation } from './Animations'
import { X } from '@/components/icons'
import { Brand, SidebarNav } from './Sidebar'


interface MobileMenuProps {
    setShowMenu: any;
}

function MobileMenu({setShowMenu}: MobileMenuProps) {
  return (
    <motion.div
    initial={{opacity: 0}}
    animate={{opacity: 1}}
    exit={{opacity: 0}}
    transition={{ duration: 0.2 }}
    className='fixed inset-0 z-50 font-mont lg:hidden'>
        <button type='button' aria-label='Close menu' onClick={() => setShowMenu(false)} className='absolute inset-0 h-full w-full cursor-default bg-ink/50 backdrop-blur-sm' />
        <motion.aside
        initial={menuAnimation.initial}
        animate={menuAnimation.animate}
        exit={menuAnimation.initial}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className='relative flex h-full w-72 max-w-[85vw] flex-col bg-ink shadow-2xl'>
            <div className='flex h-20 shrink-0 items-center justify-between gap-3 px-5'>
                <Brand />
                <button type='button' aria-label='Close menu' onClick={() => setShowMenu(false)} className='inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-lime hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60'>
                    <X size={20} />
                </button>
            </div>
            <SidebarNav onNavigate={() => setShowMenu(false)} />
        </motion.aside>
    </motion.div>
  )
}

export default MobileMenu
