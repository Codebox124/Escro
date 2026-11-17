"use client"
import { useState } from "react"
import { Menu, MenuItem } from "@mui/material"
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid"
import { formatMoney } from "@/lib/money"
import { AiOutlineEye, BadgeCheck, Ban, CircleCheck, HiOutlineDotsHorizontal, Loader2, UserLock, XCircle } from "@/components/icons"
import { statusPill } from "../ui"
import { AdminUser, UserActionHandlers, formatDate, initials, roleMeta, storeName } from "./types"

export function UserAvatar({ user, size = "sm" }: { user: Pick<AdminUser, "name" | "avatar">; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-16 w-16 text-xl ring-4 ring-lime/40" : "h-9 w-9 text-xs ring-2 ring-white"
  if (user.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatar} alt={user.name} className={`${cls} shrink-0 rounded-full object-cover`} />
  }
  return <span className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-ink font-bold text-lime`}>{initials(user.name)}</span>
}

export function RolePill({ role }: { role: string }) {
  const meta = roleMeta(role)
  const Icon = meta.icon
  return (
    <span className="inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-cream px-2.5 py-1 text-xs font-semibold text-ink [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-black/50">
      <Icon size={14} />
      {meta.label}
    </span>
  )
}

export function StatusPills({ user }: { user: AdminUser }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={statusPill(user.isActive ? "active" : "inactive")}>
        {user.isActive ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : <Ban size={12} />}
        {user.isActive ? "Active" : "Inactive"}
      </span>
      {user.isVerified && (
        <span className="inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full bg-sky-100 px-2 py-1 text-xs font-bold text-sky-800">
          <BadgeCheck size={12} /> Verified
        </span>
      )}
    </div>
  )
}

/** Orders/spent for customers, store name for sellers. */
export function userActivity(user: AdminUser): { primary: string; secondary?: string } | null {
  const role = (user.role || "").toLowerCase()
  if (role === "customer") {
    const orders = user.orders ?? 0
    return { primary: formatMoney(user.spent ?? 0, "ngn"), secondary: `${orders} order${orders === 1 ? "" : "s"}` }
  }
  if (role === "seller") {
    const name = storeName(user.store)
    return { primary: name ?? "No store yet" }
  }
  return null
}

export function getUserColumns(handlers: UserActionHandlers = {}): GridColDef<AdminUser>[] {
  return [
    {
      field: "name",
      headerName: "User",
      flex: 1.6,
      minWidth: 240,
      renderCell: ({ row }: GridRenderCellParams<AdminUser>) => (
        <div className="flex h-full min-w-0 items-center gap-3">
          <UserAvatar user={row} />
          <div className="flex min-w-0 flex-col leading-tight">
            <button
              type="button"
              onClick={() => handlers.onView?.(row)}
              className="cursor-pointer truncate text-left font-semibold text-ink hover:underline"
            >
              {row.name || "Unnamed user"}
            </button>
            <span className="truncate text-xs text-black/55">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      field: "role",
      headerName: "Role",
      flex: 0.8,
      minWidth: 130,
      renderCell: ({ row }: GridRenderCellParams<AdminUser>) => (
        <div className="flex h-full items-center"><RolePill role={row.role} /></div>
      ),
    },
    {
      field: "isActive",
      headerName: "Status",
      flex: 1,
      minWidth: 170,
      valueGetter: (_value, row) => (row.isActive ? "Active" : "Inactive") + (row.isVerified ? " · Verified" : ""),
      renderCell: ({ row }: GridRenderCellParams<AdminUser>) => (
        <div className="flex h-full items-center"><StatusPills user={row} /></div>
      ),
    },
    {
      field: "activity",
      headerName: "Activity",
      flex: 1,
      minWidth: 160,
      sortable: false,
      valueGetter: (_value, row) => {
        const a = userActivity(row)
        return a ? [a.primary, a.secondary].filter(Boolean).join(" · ") : ""
      },
      renderCell: ({ row }: GridRenderCellParams<AdminUser>) => {
        const a = userActivity(row)
        if (!a) return <div className="flex h-full items-center text-black/35">—</div>
        return (
          <div className="flex h-full min-w-0 flex-col justify-center leading-tight">
            <span className="truncate font-space font-bold text-ink">{a.primary}</span>
            {a.secondary && <span className="truncate text-xs text-black/55">{a.secondary}</span>}
          </div>
        )
      },
    },
    {
      field: "createdAt",
      headerName: "Joined",
      flex: 0.8,
      minWidth: 120,
      valueFormatter: (value: string | null | undefined) => formatDate(value),
    },
    {
      field: "actions",
      headerName: "",
      width: 72,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      disableExport: true,
      renderCell: ({ row }: GridRenderCellParams<AdminUser>) => <RowActions user={row} handlers={handlers} />,
    },
  ]
}

/** Static columns (no actions wired) — kept for legacy consumers. */
export const columns = getUserColumns()

function RowActions({ user, handlers }: { user: AdminUser; handlers: UserActionHandlers }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const busy = handlers.busyId === user.id
  const close = () => setAnchorEl(null)
  const item = "flex items-center gap-2 text-sm"

  return (
    <div className="flex h-full w-full items-center justify-end">
      <button
        type="button"
        aria-label={`Actions for ${user.name}`}
        disabled={busy}
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-black/55 transition-colors hover:bg-cream hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 disabled:cursor-wait"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <HiOutlineDotsHorizontal className="text-lg" />}
      </button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={close}
        slotProps={{ paper: { sx: { borderRadius: "20px", minWidth: 190, padding: "4px", boxShadow: "0 30px 60px -20px rgb(12 17 14 / 0.35)", border: "1px solid rgb(0 0 0 / 0.05)" } } }}
      >
        <MenuItem className={item} onClick={() => { close(); handlers.onView?.(user) }}><AiOutlineEye size={16} />View details</MenuItem>
        <MenuItem className={item} onClick={() => { close(); handlers.onToggleVerify?.(user) }}>
          {user.isVerified ? <><XCircle size={16} />Unverify</> : <><BadgeCheck size={16} />Verify</>}
        </MenuItem>
        <MenuItem className={item} onClick={() => { close(); handlers.onRequest?.({ kind: user.isActive ? "deactivate" : "activate", user }) }}>
          {user.isActive ? <><Ban size={16} />Deactivate</> : <><CircleCheck size={16} />Activate</>}
        </MenuItem>
        <MenuItem className={item} onClick={() => { close(); handlers.onRequest?.({ kind: "role", user }) }}><UserLock size={16} />Change role</MenuItem>
      </Menu>
    </div>
  )
}
