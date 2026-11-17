"use client"
import React from 'react'
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconSearch, X } from '@/components/icons'
import { filterBar, searchInput, selectTrigger } from '../ui';
import { ROLES, ROLE_META, UserRoleFilter, UserStatusFilter } from './types';

interface FilterOptionsProps {
  search?: string
  onSearchChange?: (value: string) => void
  role?: UserRoleFilter
  onRoleChange?: (value: UserRoleFilter) => void
  status?: UserStatusFilter
  onStatusChange?: (value: UserStatusFilter) => void
}

const STATUSES: { value: UserStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
]

function FilterOptions({ search = "", onSearchChange, role = "all", onRoleChange, status = "all", onStatusChange }: FilterOptionsProps) {
  return (
    <div className={filterBar}>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          <Input
            type="search"
            value={search}
            aria-label="Search users"
            placeholder="Search by name, email or phone..."
            onChange={(e) => onSearchChange?.(e.target.value)}
            className={`${searchInput} pl-10 pr-10`}
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange?.("")}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-black/45 hover:bg-cream hover:text-ink"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row">
          <Select value={role} onValueChange={(v) => onRoleChange?.(v as UserRoleFilter)}>
            <SelectTrigger className={`${selectTrigger} sm:w-44`} aria-label="Filter by role">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => onStatusChange?.(v as UserStatusFilter)}>
            <SelectTrigger className={`${selectTrigger} sm:w-44`} aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export default FilterOptions
