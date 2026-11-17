import type { ElementType } from "react"
import { HatGlasses, Motorbike, Shield, Store, Users } from "@/components/icons"

export type UserRole = "customer" | "seller" | "courier" | "agency" | "admin"
export type UserStatusFilter = "all" | "active" | "inactive" | "verified" | "unverified"
export type UserRoleFilter = "all" | UserRole

export interface AdminUser {
  id: string
  name: string
  email: string
  phone?: string | null
  role: UserRole | string
  avatar?: string | null
  isActive: boolean
  isVerified: boolean
  orders?: number | null
  spent?: number | null
  store?: string | { name?: string | null } | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type UserCounts = Partial<Record<UserRole, number>>

/** A user action that needs confirmation (or a role choice) before it is sent. */
export type PendingUserAction =
  | { kind: "activate" | "deactivate"; user: AdminUser }
  | { kind: "role"; user: AdminUser }

export interface UserActionHandlers {
  onView?: (user: AdminUser) => void
  onToggleVerify?: (user: AdminUser) => void
  onRequest?: (action: PendingUserAction) => void
  busyId?: string | null
}

export const ROLES: UserRole[] = ["customer", "seller", "courier", "agency", "admin"]

export const ROLE_META: Record<UserRole, { label: string; plural: string; icon: ElementType }> = {
  customer: { label: "Customer", plural: "Customers", icon: Users },
  seller: { label: "Seller", plural: "Sellers", icon: Store },
  courier: { label: "Courier", plural: "Couriers", icon: Motorbike },
  agency: { label: "Agency", plural: "Agencies", icon: HatGlasses },
  admin: { label: "Admin", plural: "Admins", icon: Shield },
}

export function roleMeta(role: string) {
  return ROLE_META[(role || "").toLowerCase() as UserRole] ?? { label: role || "Unknown", plural: role || "Unknown", icon: Users }
}

/** Accepts legacy values like "store" / "Customer" / "All" and maps them to an API role filter. */
export function normalizeRoleFilter(value: unknown): UserRoleFilter {
  const v = String(value ?? "").toLowerCase()
  if (v === "store" || v === "stores" || v === "seller") return "seller"
  if ((ROLES as string[]).includes(v)) return v as UserRole
  return "all"
}

export function storeName(store: AdminUser["store"]): string | null {
  if (!store) return null
  if (typeof store === "string") return store
  return store.name ?? null
}

export function formatDate(value?: string | null, withTime = false): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  })
}

export function initials(name?: string | null): string {
  const parts = (name || "?").trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}

export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message || fallback
  }
  return fallback
}
