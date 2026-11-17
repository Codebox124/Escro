import type { AnnouncementTone } from "@/components/ui/platform-banner"

export type { AnnouncementTone }

export interface PlatformSettings {
  maintenance: { enabled: boolean; message: string }
  announcement: { enabled: boolean; text: string; tone: AnnouncementTone }
  ordersPaused: boolean
  signupsPaused: boolean
  /** NGN, used when an order has no shipping fee */
  defaultDeliveryFee: number
  courierMaxActiveJobs: number
  /** % of the items subtotal Escro keeps when escrow is released (0–50) */
  commissionRate: number
  updatedAt: string | null
}

export interface SettingsResponse {
  settings: PlatformSettings
  available: boolean
}

export type SettingsPatch = Partial<Omit<PlatformSettings, "updatedAt">>

export type CheckStatus = "ok" | "warning" | "unknown"

export interface HealthCheck {
  key: string
  label: string
  value: number | null
  status: CheckStatus
  hint?: string
}

export interface PlatformHealth {
  database: { ok: boolean; latencyMs: number; error: string | null }
  api: { uptimeSeconds: number; node?: string; environment?: string }
  payments: { mode: string; stripeConfigured: boolean }
  settingsAvailable: boolean
  flags: { maintenance: boolean; ordersPaused: boolean; signupsPaused: boolean }
  checks: HealthCheck[]
  checkedAt: string
}

export interface AuditEntry {
  id: string
  action: string
  targetType: string | null
  targetId: string | null
  details: Record<string, unknown> | null
  admin: { name: string | null; email: string | null } | null
  createdAt: string
}

export interface AuditResponse {
  available: boolean
  entries: AuditEntry[]
}

export const SETUP_NOTICE =
  "Database setup needed — run backend/database/migrations/006_platform_settings.sql in the Supabase SQL editor."

export const MAX_ANNOUNCEMENT = 280
export const MAX_MAINTENANCE_MESSAGE = 300

/** "3d 4h", "2h 15m", "45s" */
export function formatUptime(seconds: number | null | undefined): string {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}

/** "just now", "5 min ago", "3 h ago", "2 days ago", then a date */
export function relativeTime(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "—"
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return "—"
  const diff = Math.max(0, Math.round((now - t) / 1000))
  if (diff < 45) return "just now"
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))} min ago`
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`
  const days = Math.round(diff / 86400)
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`
  return new Date(t).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
}

export function clockTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return "—"
  return d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit", second: "2-digit" })
}
