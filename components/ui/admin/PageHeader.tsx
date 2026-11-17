"use client"
import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  eyebrow?: string
}

function PageHeader({ title, subtitle, actions, eyebrow = 'Admin console' }: PageHeaderProps) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'
    >
      <div className='min-w-0'>
        <p className='eyebrow font-space text-emerald-700'>{eyebrow}</p>
        <h1 className='mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl'><span className='line-mask'><span key={title} className='anim-rise'>{title}</span></span></h1>
        {subtitle && <p key={subtitle} style={{ '--d': '120ms' } as React.CSSProperties} className='anim-focus mt-2 max-w-2xl text-sm text-black/55 sm:text-base'>{subtitle}</p>}
      </div>
      {actions && <div className='flex flex-wrap items-center gap-2 sm:shrink-0'>{actions}</div>}
    </motion.div>
  )
}

export default PageHeader
