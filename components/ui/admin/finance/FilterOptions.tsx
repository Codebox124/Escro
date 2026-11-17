"use client"
import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconSearch } from '@/components/icons'
import { filterBar, searchInput, selectTrigger } from '../ui'

export type EscrowFilter = 'all' | 'held' | 'released' | 'refunded' | 'disputed'

interface FilterOptionsProps {
  search: string
  onSearchChange: (value: string) => void
  status: EscrowFilter
  onStatusChange: (value: EscrowFilter) => void
  disabled?: boolean
}

function FilterOptions({ search, onSearchChange, status, onStatusChange, disabled }: FilterOptionsProps) {
  return (
    <div className={filterBar}>
      <label className='relative min-w-0 flex-1'>
        <span className='sr-only'>Search transactions</span>
        <IconSearch size={16} className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/40' />
        <input
          type='search'
          value={search}
          disabled={disabled}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder='Search order #, store or customer'
          className={`${searchInput} pl-10`}
        />
      </label>
      <Select value={status} onValueChange={(v) => onStatusChange(v as EscrowFilter)} disabled={disabled}>
        <SelectTrigger aria-label='Filter by escrow status' className={selectTrigger}>
          <SelectValue placeholder='All statuses' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All statuses</SelectItem>
          <SelectItem value='held'>Held</SelectItem>
          <SelectItem value='released'>Released</SelectItem>
          <SelectItem value='disputed'>Disputed</SelectItem>
          <SelectItem value='refunded'>Refunded</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export default FilterOptions
