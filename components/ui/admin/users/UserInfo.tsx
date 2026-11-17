"use client"
import React, { useEffect } from 'react'
import { motion } from "framer-motion"
import { BadgeCheck, Ban, CircleCheck, Loader2, Mail, Phone, UserLock, X, XCircle } from '@/components/icons';
import { formatMoney } from '@/lib/money';
import { alertAnimation } from '../Animations';
import { btnDanger, btnPrimary, btnSecondary, monoLabel } from '../ui';
import { RolePill, StatusPills, UserAvatar } from './columns';
import { AdminUser, UserActionHandlers, formatDate, storeName } from './types';

interface UserInfoProps extends UserActionHandlers {
  user?: AdminUser | null
  onClose?: () => void
}

function UserInfo({ user, onClose, onToggleVerify, onRequest, busyId }: UserInfoProps) {
  useEffect(() => {
    if (!onClose) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  if (!user) return null
  const busy = busyId === user.id
  const role = (user.role || "").toLowerCase()
  const store = storeName(user.store)

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: "Role", value: <RolePill role={user.role} /> },
    { label: "Status", value: <StatusPills user={user} /> },
    { label: "Email", value: user.email ? <a href={`mailto:${user.email}`} className="break-all font-medium text-ink underline-offset-2 hover:underline">{user.email}</a> : "—" },
    { label: "Phone", value: user.phone ? <a href={`tel:${user.phone}`} className="font-medium text-ink underline-offset-2 hover:underline">{user.phone}</a> : "—" },
    ...(role === "customer"
      ? [
          { label: "Orders", value: <span className="font-space font-bold">{(user.orders ?? 0).toLocaleString("en-NG")}</span> },
          { label: "Total spent", value: <span className="font-space font-bold">{formatMoney(user.spent ?? 0, "ngn")}</span> },
        ]
      : []),
    ...(role === "seller" || store ? [{ label: "Store", value: store ?? "No store yet" }] : []),
    { label: "Joined", value: formatDate(user.createdAt, true) },
    { label: "Last updated", value: formatDate(user.updatedAt, true) },
    { label: "User ID", value: <span className="break-all font-space text-xs">{user.id}</span> },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className='fixed inset-0 z-50 flex justify-end bg-ink/50 font-mont backdrop-blur-sm'
    >
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${user.name}`}
        initial={alertAnimation.initial}
        exit={alertAnimation.initial}
        animate={alertAnimation.animate}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        onClick={(e) => e.stopPropagation()}
        className='flex h-full w-full flex-col overflow-hidden bg-white shadow-[0_0_80px_-20px_rgba(12,17,14,0.5)] sm:max-w-md sm:rounded-l-3xl lg:max-w-lg'
      >
        <div className='flex items-start justify-between gap-3 border-b border-black/5 p-5 sm:px-6'>
          <div className='min-w-0'>
            <h2 className='text-lg font-extrabold tracking-[-0.02em] text-ink'>User details</h2>
            <p className='truncate text-sm text-black/55'>Account information and admin actions.</p>
          </div>
          <button type='button' aria-label='Close' onClick={onClose} className='inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-cream text-ink transition-colors hover:bg-lime'><X size={18} /></button>
        </div>

        <div className='flex flex-1 flex-col gap-4 overflow-y-auto p-5 sm:p-6'>
          <div className='surface-card p-5'>
            <div className='flex items-center gap-4'>
              <UserAvatar user={user} size="lg" />
              <div className='flex min-w-0 flex-col gap-1'>
                <span className='truncate text-lg font-extrabold tracking-[-0.02em] text-ink'>{user.name || "Unnamed user"}</span>
                <span className='flex min-w-0 items-center gap-1.5 text-sm text-black/55'><Mail className='h-4 w-4 shrink-0' /><span className='truncate'>{user.email}</span></span>
                {user.phone && <span className='flex min-w-0 items-center gap-1.5 text-sm text-black/55'><Phone className='h-4 w-4 shrink-0' /><span className='truncate'>{user.phone}</span></span>}
              </div>
            </div>
            <dl className='mt-5 grid grid-cols-1 gap-4 border-t border-black/5 pt-4 text-sm min-[400px]:grid-cols-2'>
              {fields.map((f) => (
                <div key={f.label} className='min-w-0'>
                  <dt className={monoLabel}>{f.label}</dt>
                  <dd className='mt-1 text-ink'>{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className='surface-card flex flex-col gap-3 p-5'>
            <p className={monoLabel}>Admin actions</p>
            <div className='grid grid-cols-1 gap-2 min-[400px]:grid-cols-2'>
              <button type='button' disabled={busy} onClick={() => onToggleVerify?.(user)} className={btnSecondary}>
                {busy ? <Loader2 size={16} className='animate-spin' /> : user.isVerified ? <XCircle size={16} /> : <BadgeCheck size={16} />}
                {user.isVerified ? "Unverify" : "Verify"}
              </button>
              <button type='button' disabled={busy} onClick={() => onRequest?.({ kind: "role", user })} className={btnSecondary}>
                <UserLock size={16} />Change role
              </button>
              <button
                type='button'
                disabled={busy}
                onClick={() => onRequest?.({ kind: user.isActive ? "deactivate" : "activate", user })}
                className={`${user.isActive ? btnDanger : btnPrimary} min-[400px]:col-span-2`}
              >
                {user.isActive ? <><Ban size={16} />Deactivate account</> : <><CircleCheck size={16} />Activate account</>}
              </button>
            </div>
          </div>
        </div>

        <div className='border-t border-black/5 p-4 sm:px-6'>
          <button type='button' onClick={onClose} className={`${btnSecondary} w-full`}>Close</button>
        </div>
      </motion.aside>
    </motion.div>
  )
}

export default UserInfo
