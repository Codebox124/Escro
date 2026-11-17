"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from "framer-motion"
import { useGridApiRef } from '@mui/x-data-grid'
import { adminApi } from '@/services/admin'
import { CircleAlert, Download, LuUserRoundSearch, RefreshCw } from '@/components/icons'
import DataTable from '../DataTable'
import { getUserColumns } from '../users/columns'
import { useAdminContext } from '../AdminContext'
import FilterOptions from '../users/FilterOptions'
import UserInfo from '../users/UserInfo'
import Stats from '../users/Stats'
import ConfirmUserAction from '../users/ConfirmUserAction'
import PageHeader from '../PageHeader'
import { btnPrimary, btnSecondary, pageWrapper } from '../ui'
import {
  AdminUser,
  PendingUserAction,
  UserCounts,
  UserRole,
  UserRoleFilter,
  UserStatusFilter,
  errorMessage,
  normalizeRoleFilter,
} from '../users/types'

interface UsersResult {
  key: string
  users: AdminUser[]
  counts: UserCounts | null
}

function Users() {
  const { usersFilterValue, setUsersFilterValue, handleAlert } = useAdminContext()
  // Role filter lives in context so Dashboard quick actions can open this page pre-filtered.
  const role = normalizeRoleFilter(usersFilterValue)
  const setRole = (r: UserRoleFilter) => setUsersFilterValue(r)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState<UserStatusFilter>("all")
  const [reloadKey, setReloadKey] = useState(0)

  const [result, setResult] = useState<UsersResult | null>(null)
  const [error, setError] = useState<{ key: string; message: string } | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingUserAction | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const apiRef = useGridApiRef()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  const requestKey = JSON.stringify([debouncedSearch, role, status, reloadKey])

  useEffect(() => {
    let cancelled = false
    const params: Record<string, string> = {}
    if (debouncedSearch) params.search = debouncedSearch
    if (role !== "all") params.role = role
    if (status !== "all") params.status = status
    adminApi
      .users(params)
      .then((data: { users?: AdminUser[]; counts?: UserCounts } | null) => {
        if (cancelled) return
        setResult({ key: requestKey, users: data?.users ?? [], counts: data?.counts ?? null })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError({ key: requestKey, message: errorMessage(err, "Couldn't load users.") })
      })
    return () => { cancelled = true }
    // requestKey encodes every input of this request
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  const loading = result?.key !== requestKey && error?.key !== requestKey
  const loadError = error?.key === requestKey ? error.message : null
  const users = useMemo(() => result?.users ?? [], [result])
  const selectedUser = useMemo(() => users.find((u) => u.id === selectedId) ?? null, [users, selectedId])

  const retry = () => setReloadKey((k) => k + 1)

  /** Sends a PATCH, swaps the returned user into the table and keeps role counts in sync. */
  const updateUser = useCallback(async (user: AdminUser, patch: { isActive?: boolean; isVerified?: boolean; role?: UserRole }) => {
    setBusyId(user.id)
    try {
      const updated: AdminUser | null = await adminApi.updateUser(user.id, patch)
      const next: AdminUser = { ...user, ...patch, ...(updated ?? {}) }
      setResult((prev) => {
        if (!prev) return prev
        const counts = { ...(prev.counts ?? {}) }
        const oldRole = (user.role || "").toLowerCase() as UserRole
        const newRole = (next.role || "").toLowerCase() as UserRole
        if (oldRole !== newRole) {
          counts[oldRole] = Math.max(0, (counts[oldRole] ?? 1) - 1)
          counts[newRole] = (counts[newRole] ?? 0) + 1
        }
        return { ...prev, counts, users: prev.users.map((u) => (u.id === user.id ? next : u)) }
      })
      return next
    } finally {
      setBusyId(null)
    }
  }, [])

  const toggleVerify = useCallback(async (user: AdminUser) => {
    try {
      const next = await updateUser(user, { isVerified: !user.isVerified })
      handleAlert(`${next.name} ${next.isVerified ? "verified" : "unverified"}`, "good")
    } catch (err) {
      handleAlert(errorMessage(err, "Couldn't update verification."), "bad")
    }
  }, [updateUser, handleAlert])

  async function confirmPending(patch: { isActive?: boolean; role?: UserRole }) {
    if (!pending) return
    try {
      const next = await updateUser(pending.user, patch)
      setPending(null)
      handleAlert(
        patch.role ? `${next.name} is now ${patch.role === "admin" ? "an" : "a"} ${patch.role}` : `${next.name} ${next.isActive ? "activated" : "deactivated"}`,
        "good",
      )
    } catch (err) {
      const message = errorMessage(err, "Couldn't update this user.")
      handleAlert(message, "bad")
      throw new Error(message)
    }
  }

  const columns = useMemo(
    () => getUserColumns({ onView: (u) => setSelectedId(u.id), onToggleVerify: toggleVerify, onRequest: setPending, busyId }),
    [toggleVerify, busyId],
  )

  const exportCSV = () => apiRef.current?.exportDataAsCsv({ fileName: "escro-users" })
  const hasFilters = Boolean(debouncedSearch) || role !== "all" || status !== "all"
  const clearFilters = () => { setSearch(""); setDebouncedSearch(""); setStatus("all"); setRole("all") }

  return <>
    <AnimatePresence>
      {selectedUser && (
        <UserInfo
          key="user-info"
          user={selectedUser}
          onClose={() => setSelectedId(null)}
          onToggleVerify={toggleVerify}
          onRequest={setPending}
          busyId={busyId}
        />
      )}
    </AnimatePresence>
    <AnimatePresence>
      {pending && (
        <ConfirmUserAction
          key={`${pending.kind}-${pending.user.id}`}
          action={pending}
          onCancel={() => setPending(null)}
          onConfirm={confirmPending}
        />
      )}
    </AnimatePresence>

    <div className={pageWrapper}>
      <PageHeader
        title='Users'
        subtitle='Manage customers, sellers, couriers, agencies and admins on the platform.'
        actions={<>
          <button type='button' onClick={retry} disabled={loading} className={`${btnSecondary} flex-1 sm:flex-none`}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button type='button' onClick={exportCSV} disabled={!users.length} className={`${btnPrimary} flex-1 sm:flex-none`}>
            <Download size={16} /> Export
          </button>
        </>}
      />
      <Stats counts={result?.counts} loading={loading} activeRole={role} onSelectRole={setRole} />
      <FilterOptions
        search={search}
        onSearchChange={setSearch}
        role={role}
        onRoleChange={setRole}
        status={status}
        onStatusChange={setStatus}
      />

      {loadError ? (
        <div role="alert" className='surface-card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center'>
          <span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600'><CircleAlert size={22} /></span>
          <div>
            <p className='font-bold text-ink'>Couldn&apos;t load users</p>
            <p className='mt-1 max-w-md text-sm text-black/55'>{loadError}</p>
          </div>
          <button type='button' onClick={retry} className={btnPrimary}><RefreshCw size={16} /> Try again</button>
        </div>
      ) : loading && !result ? (
        <UsersSkeleton />
      ) : users.length === 0 && !loading ? (
        <div className='surface-card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center'>
          <span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-cream text-black/40'><LuUserRoundSearch size={22} /></span>
          <div>
            <p className='font-bold text-ink'>{hasFilters ? "No users match these filters" : "No users yet"}</p>
            <p className='mt-1 text-sm text-black/55'>{hasFilters ? "Try a different search, role or status." : "New sign-ups will show up here."}</p>
          </div>
          {hasFilters && <button type='button' onClick={clearFilters} className={btnSecondary}>Clear filters</button>}
        </div>
      ) : (
        <div className={`transition-opacity ${loading ? 'pointer-events-none opacity-60' : ''}`} aria-busy={loading}>
          <DataTable apiRef={apiRef} columns={columns} rows={users} />
        </div>
      )}
    </div>
  </>
}

function UsersSkeleton() {
  return (
    <div className='surface-card overflow-hidden' aria-busy="true" aria-label="Loading users">
      <div className='h-12 border-b border-black/5 bg-cream' />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className='flex items-center gap-4 border-b border-black/5 px-5 py-4 last:border-0'>
          <span className='h-9 w-9 shrink-0 animate-pulse rounded-full bg-black/10' />
          <div className='flex min-w-0 flex-1 flex-col gap-2'>
            <span className='h-3.5 w-40 max-w-full animate-pulse rounded bg-black/10' />
            <span className='h-3 w-56 max-w-full animate-pulse rounded bg-black/5' />
          </div>
          <span className='hidden h-6 w-20 animate-pulse rounded-full bg-black/5 sm:block' />
          <span className='hidden h-6 w-24 animate-pulse rounded-full bg-black/5 md:block' />
          <span className='hidden h-4 w-20 animate-pulse rounded bg-black/5 lg:block' />
        </div>
      ))}
    </div>
  )
}

export default Users
