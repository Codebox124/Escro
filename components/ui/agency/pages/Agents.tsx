"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from "framer-motion"
import { Download, RefreshCw, UserPlus, Users, Search } from '@/components/icons'
import { agencyApi } from '@/services/agency'
import { useAgencyContext } from '../AgencyContext'
import FilterOptions, { type AgentStatusFilter } from '../agents/FilterOptions'
import AgentInfo from '../agents/AgentInfo'
import AgentList, { AgentListSkeleton } from '../agents/AgentList'
import AddAgentModal from '../agents/AddAgentModal'
import RemoveAgentModal from '../agents/RemoveAgentModal'
import Stats from '../agents/Stats'
import PageHeader from '../PageHeader'
import { btnPrimary, btnSecondary, pageWrapper } from '../ui'
import { Agent, AgentStats, LoadError, agencyError, formatDate, formatRating, vehicleLabel } from '../agents/shared'

function computeStats(agents: Agent[]): AgentStats {
  return {
    total: agents.length,
    online: agents.filter(a => a.isOnline).length,
    active: agents.filter(a => a.activeDeliveries > 0).length,
    deliveredThisWeek: agents.reduce((s, a) => s + (Number(a.deliveredThisWeek) || 0), 0),
    earningsTotal: agents.reduce((s, a) => s + (Number(a.earningsTotal) || 0), 0),
  }
}

function exportCsv(agents: Agent[]) {
  const header = ['Name', 'Email', 'Phone', 'Vehicle', 'Online', 'Verified', 'Active deliveries', 'Delivered this week', 'Total deliveries', 'Earnings (NGN)', 'Rating', 'Joined']
  const rows = agents.map(a => [
    a.name, a.email ?? '', a.phone ?? '', vehicleLabel(a.vehicleType), a.isOnline ? 'Yes' : 'No', a.isVerified ? 'Yes' : 'No',
    a.activeDeliveries, a.deliveredThisWeek, a.totalDeliveries, Number(a.earningsTotal) || 0, formatRating(a.rating), formatDate(a.joinedAt),
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'agency-agents.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function Agents() {
  const { handleAlert } = useAgencyContext()
  const [agents, setAgents] = useState<Agent[]>([])
  const [serverStats, setServerStats] = useState<AgentStats | null>(null)
  // After a local add/remove, recompute from the list instead of showing stale server stats.
  const [edited, setEdited] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<AgentStatusFilter>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [viewing, setViewing] = useState<Agent | null>(null)
  const [removing, setRemoving] = useState<Agent | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await agencyApi.agents()
      const list: Agent[] = Array.isArray(res?.agents) ? res.agents : []
      setAgents(list)
      setServerStats(res?.stats ?? null)
      setEdited(false)
    } catch (err) {
      setError(agencyError(err, 'Could not load your team.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function handleAdded(agent: Agent) {
    if (!agent || !agent.id) { load(); return }
    setAgents(prev => [agent, ...prev.filter(a => a.id !== agent.id)])
    setEdited(true)
    handleAlert?.(`${agent.name || 'Agent'} added to your team`, 'good')
  }

  function handleRemoved(courierId: string) {
    setAgents(prev => prev.filter(a => a.id !== courierId))
    setEdited(true)
    setViewing(v => (v?.id === courierId ? null : v))
    handleAlert?.('Agent removed from your team', 'good')
  }

  const stats = useMemo(
    () => (loading ? null : !edited && serverStats ? serverStats : computeStats(agents)),
    [loading, edited, serverStats, agents]
  )

  const counts = useMemo(() => ({
    all: agents.length,
    online: agents.filter(a => a.isOnline).length,
    offline: agents.filter(a => !a.isOnline).length,
  }), [agents])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return agents.filter(a => {
      if (status === 'online' && !a.isOnline) return false
      if (status === 'offline' && a.isOnline) return false
      if (!q) return true
      return [a.name, a.email, a.phone, a.vehicleType].some(v => (v || '').toLowerCase().includes(q))
    })
  }, [agents, query, status])

  const closeInfo = useCallback(() => setViewing(null), [])

  return <>
    <AnimatePresence>
      {viewing && <AgentInfo key={viewing.id} agent={viewing} onClose={closeInfo} onRemove={setRemoving} />}
    </AnimatePresence>
    {showAdd && <AddAgentModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />}
    {removing && <RemoveAgentModal agent={removing} onClose={() => setRemoving(null)} onRemoved={handleRemoved} />}

    <div className={pageWrapper}>
        <PageHeader
          title='Agents'
          subtitle='Your courier team — who’s online, what they’re delivering and how they’re performing.'
          actions={<>
            <button type='button' onClick={() => exportCsv(filtered)} disabled={loading || filtered.length === 0} className={`${btnSecondary} flex-1 sm:flex-none`}><Download size={16} /> Export</button>
            <button type='button' onClick={() => setShowAdd(true)} className={`${btnPrimary} flex-1 sm:flex-none`}><UserPlus size={16} /> Add agent</button>
          </>}
        />

        {error ? (
          <div className='surface-card p-4 sm:p-6'>
            <LoadError error={error} onRetry={load} />
          </div>
        ) : (
          <>
            <Stats stats={stats} loading={loading} />
            <FilterOptions query={query} onQueryChange={setQuery} status={status} onStatusChange={setStatus} counts={counts} />
            {loading ? (
              <AgentListSkeleton />
            ) : agents.length === 0 ? (
              <div className='surface-card flex flex-col items-center justify-center gap-3 px-4 py-14 text-center'>
                <span className='flex h-14 w-14 items-center justify-center rounded-2xl bg-cream text-ink'><Users size={26} /></span>
                <div>
                  <p className='text-lg font-extrabold tracking-[-0.02em] text-ink'>Build your courier team</p>
                  <p className='mx-auto mt-1 max-w-sm text-sm text-black/55'>Add couriers who already have an Escro courier account. Their deliveries and earnings will show up here.</p>
                </div>
                <button type='button' onClick={() => setShowAdd(true)} className={btnPrimary}><UserPlus size={16} /> Add your first agent</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className='surface-card flex flex-col items-center justify-center gap-3 px-4 py-12 text-center'>
                <Search size={26} className='text-black/25' />
                <p className='text-sm text-black/55'>No agents match your search.</p>
                <button type='button' onClick={() => { setQuery(''); setStatus('all') }} className={btnSecondary}>Clear filters</button>
              </div>
            ) : (
              <>
                <AgentList agents={filtered} onView={setViewing} onRemove={setRemoving} />
                <div className='flex items-center justify-between gap-3 text-xs text-black/45'>
                  <span>Showing {filtered.length} of {agents.length}</span>
                  <button type='button' onClick={load} className='inline-flex cursor-pointer items-center gap-1.5 font-semibold hover:text-ink'><RefreshCw size={12} /> Refresh</button>
                </div>
              </>
            )}
          </>
        )}
    </div>
  </>
}

export default Agents
