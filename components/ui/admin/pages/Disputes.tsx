"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { adminApi } from '@/services/admin'
import { RefreshCw } from '@/components/icons'
import DisputesList from '../disputes/DisputesList'
import FilterOptions from '../disputes/FilterOptions'
import ResolveDialog from '../disputes/ResolveDialog'
import PageHeader from '../PageHeader'
import { useAdminContext } from '../AdminContext'
import { btnSecondary, pageWrapper } from '../ui'
import { errorMessage } from '../users/types'
import { AdminDispute, DisputeStatus, DisputeTab, ResolveAction, applyResolution, reasonLabel } from '../disputes/types'

const STATUSES: DisputeStatus[] = ["open", "resolved", "rejected"]

function Disputes() {
  const { handleAlert } = useAdminContext()
  const [tab, setTab] = useState<DisputeTab>("open")
  const [search, setSearch] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState<{ key: number; disputes: AdminDispute[] } | null>(null)
  const [error, setError] = useState<{ key: number; message: string } | null>(null)
  const [resolving, setResolving] = useState<AdminDispute | null>(null)

  // Load each status once (in parallel), merge, then filter by tab client-side.
  useEffect(() => {
    let cancelled = false
    Promise.all(STATUSES.map((status) => adminApi.disputes({ status })))
      .then((pages: Array<{ disputes?: AdminDispute[] } | null>) => {
        if (cancelled) return
        const byId = new Map<string, AdminDispute>()
        pages.forEach((p) => (p?.disputes ?? []).forEach((d) => byId.set(d.id, d)))
        const all = [...byId.values()].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
        setResult({ key: reloadKey, disputes: all })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError({ key: reloadKey, message: errorMessage(err, "Couldn't load disputes.") })
      })
    return () => { cancelled = true }
  }, [reloadKey])

  const loading = result?.key !== reloadKey && error?.key !== reloadKey
  const loadError = error?.key === reloadKey ? error.message : null
  const all = useMemo(() => result?.disputes ?? [], [result])

  const counts = useMemo(() => {
    const c: Record<DisputeTab, number> = { open: 0, resolved: 0, rejected: 0, all: all.length }
    all.forEach((d) => {
      const s = (d.status || "").toLowerCase() as DisputeStatus
      if (s in c) c[s] += 1
    })
    return c
  }, [all])

  const q = search.trim().toLowerCase()
  const visible = useMemo(() => all.filter((d) => {
    if (tab !== "all" && (d.status || "").toLowerCase() !== tab) return false
    if (!q) return true
    return [d.order?.orderNumber, d.order?.id, d.customer?.name, d.customer?.email, d.customer?.phone, d.store?.name, reasonLabel(d.reason), d.details]
      .some((v) => (v ?? "").toString().toLowerCase().includes(q))
  }), [all, tab, q])

  async function resolve(action: ResolveAction, note: string) {
    if (!resolving) return
    const target = resolving
    try {
      const returned: Partial<AdminDispute> | null = await adminApi.resolveDispute(target.id, action, note)
      const next = applyResolution(target, action, note, returned)
      setResult((prev) => prev && { ...prev, disputes: prev.disputes.map((d) => (d.id === target.id ? next : d)) })
      setResolving(null)
      handleAlert(action === "refund" ? "Buyer refunded" : action === "release" ? "Funds released to seller" : "Dispute rejected", "good")
    } catch (err) {
      const message = errorMessage(err, "Couldn't resolve this dispute.")
      handleAlert(message, "bad")
      throw new Error(message)
    }
  }

  return (
    <>
      <AnimatePresence>
        {resolving && (
          <ResolveDialog key={resolving.id} dispute={resolving} onCancel={() => setResolving(null)} onConfirm={resolve} />
        )}
      </AnimatePresence>
      <div className={pageWrapper}>
        <PageHeader
          title='Disputes'
          subtitle='Review escrow disputes between buyers and stores, and settle them fairly.'
          actions={
            <button type='button' onClick={() => setReloadKey((k) => k + 1)} disabled={loading} className={`${btnSecondary} w-full sm:w-auto`}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          }
        />
        <FilterOptions tab={tab} onTabChange={setTab} counts={counts} loading={loading && !result} search={search} onSearchChange={setSearch} />
        <DisputesList
          disputes={visible}
          loading={loading && !result}
          error={loadError}
          onRetry={() => setReloadKey((k) => k + 1)}
          onResolve={setResolving}
          tab={tab}
          searching={Boolean(q)}
        />
      </div>
    </>
  )
}

export default Disputes
