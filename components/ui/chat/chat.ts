// Shared types + helpers for service-request conversations (agency dashboard + buyer dashboard).

export type RequestStatus = "pending" | "accepted" | "declined" | "completed" | "cancelled"

export type ChatMessage = {
  id: string
  body: string
  senderId?: string
  mine: boolean
  readAt?: string | null
  createdAt: string
}

export type ChatThread = {
  requestId: string
  status: RequestStatus
  service: {
    id: string
    title: string
    price?: number
    priceType?: string
    currency?: string
    image?: string | null
    providerId?: string
  } | null
  me: "provider" | "customer"
  other: { name?: string | null; avatar?: string | null; role?: string | null } | null
  lastMessage: ChatMessage | null
  unread: number
  opener: { body: string; createdAt: string; fromCustomer?: boolean } | null
  updatedAt: string
}

/** Requests in these states reject new messages. */
export const CLOSED_STATUSES: RequestStatus[] = ["declined", "cancelled"]
export const isClosed = (status?: string | null) => !!status && (CLOSED_STATUSES as string[]).includes(status)

export const errorText = (e: unknown, fallback = "Something went wrong") =>
  (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string"
    ? (e as { message: string }).message
    : "") || fallback

/** Returns the migration file a backend error is asking for, if any. */
export function setupFile(message?: string | null): string | null {
  if (!message) return null
  const m = message.match(/\b(00\d_[a-z_]+\.sql)\b/i)
  if (m) return m[1]
  return null
}

export function initials(name?: string | null) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  return ((parts[0][0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] || "" : "")).toUpperCase()
}

const toDate = (d?: string | null) => {
  if (!d) return null
  const date = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00`) : new Date(d)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(d?: string | null, withYear = true) {
  const date = toDate(d)
  if (!date) return d || ""
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) })
}

export function formatClock(d?: string | null) {
  const date = toDate(d)
  if (!date) return ""
  return date.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** "Today", "Yesterday" or "12 Mar 2026" */
export function dayLabel(d?: string | null) {
  const date = toDate(d)
  if (!date) return ""
  const now = new Date()
  if (sameDay(date, now)) return "Today"
  const y = new Date(now)
  y.setDate(now.getDate() - 1)
  if (sameDay(date, y)) return "Yesterday"
  return formatDate(d, date.getFullYear() !== now.getFullYear())
}

/** Compact time for thread lists: "14:05", "Yesterday", "12 Mar" */
export function shortTime(d?: string | null) {
  const date = toDate(d)
  if (!date) return ""
  const label = dayLabel(d)
  return label === "Today" ? formatClock(d) : label
}

export const dayKey = (d?: string | null) => {
  const date = toDate(d)
  return date ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : ""
}
