"use client"
import React from 'react'
import { Search, X } from '@/components/icons'
import { searchInput } from '../ui'
import { FILTERS, type ProjectFilter } from './types'

interface Props {
  filter: ProjectFilter
  setFilter: (f: ProjectFilter) => void
  search: string
  setSearch: (s: string) => void
  counts: Record<ProjectFilter, number>
}

function FilterOptions({ filter, setFilter, search, setSearch, counts }: Props) {
  return (
    <div className='surface-card flex min-w-0 flex-col gap-3 p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between'>
      <div
        role='tablist'
        aria-label='Filter projects by status'
        className='-mx-1 flex min-w-0 gap-1 overflow-x-auto px-1 pb-1 xl:pb-0'
      >
        {FILTERS.map((f) => {
          const active = filter === f.value
          return (
            <button
              key={f.value}
              type='button'
              role='tab'
              aria-selected={active}
              onClick={() => setFilter(f.value)}
              className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                active ? 'bg-ink text-white' : 'bg-cream text-ink hover:bg-lime'
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 py-0.5 font-space text-[11px] ${active ? 'bg-lime text-ink' : 'bg-white text-black/60'}`}
              >
                {counts[f.value]}
              </span>
            </button>
          )
        })}
      </div>
      <div className='relative w-full xl:max-w-sm'>
        <label htmlFor='projects-search' className='sr-only'>Search projects</label>
        <Search className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40' />
        <input
          id='projects-search'
          type='search'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search customer or service…'
          className={`${searchInput} pl-10 pr-10`}
        />
        {search && (
          <button
            type='button'
            onClick={() => setSearch('')}
            aria-label='Clear search'
            className='absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-black/50 hover:bg-cream hover:text-ink'
          >
            <X className='h-4 w-4' />
          </button>
        )}
      </div>
    </div>
  )
}

export default FilterOptions
