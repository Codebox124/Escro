"use client"
import React, { useCallback, useEffect, useState } from "react"
import { CircleCheck, Construction, Megaphone, ShoppingCart, TriangleAlert, X } from "@/components/icons"
import { platformApi } from "@/services/admin"

export type AnnouncementTone = "info" | "success" | "warning"

/** Public platform status (GET /api/platform/status). */
export interface PlatformStatus {
  maintenance?: { enabled?: boolean; message?: string } | null
  announcement?: { enabled?: boolean; text?: string; tone?: AnnouncementTone | string } | null
  ordersPaused?: boolean
  signupsPaused?: boolean
}

export type NoticeVariant = "maintenance" | "orders" | AnnouncementTone

/** Who is looking at the banner. Only the buyer dashboard sees "orders paused". */
export type BannerAudience = "buyer" | "seller" | "courier" | "agency" | "admin"

/** Event other parts of the app can dispatch to make banners refetch immediately. */
export const PLATFORM_STATUS_EVENT = "escro:platform-status"

const VARIANTS: Record<NoticeVariant, { shell: string; icon: string; Icon: React.ElementType; close: string }> = {
  maintenance: {
    shell: "bg-ink text-white ring-1 ring-ink",
    icon: "bg-amber-400 text-ink",
    Icon: Construction,
    close: "text-white/60 hover:bg-white/10 hover:text-white",
  },
  info: {
    shell: "bg-ink text-white ring-1 ring-ink",
    icon: "bg-white/10 text-lime",
    Icon: Megaphone,
    close: "text-white/60 hover:bg-white/10 hover:text-white",
  },
  success: {
    shell: "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200",
    icon: "bg-emerald-100 text-emerald-700",
    Icon: CircleCheck,
    close: "text-emerald-800/60 hover:bg-emerald-100 hover:text-emerald-900",
  },
  warning: {
    shell: "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
    icon: "bg-amber-100 text-amber-700",
    Icon: TriangleAlert,
    close: "text-amber-800/60 hover:bg-amber-100 hover:text-amber-900",
  },
  orders: {
    shell: "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
    icon: "bg-amber-100 text-amber-700",
    Icon: ShoppingCart,
    close: "text-amber-800/60 hover:bg-amber-100 hover:text-amber-900",
  },
}

interface PlatformNoticeProps {
  variant: NoticeVariant
  message: string
  title?: string
  onDismiss?: () => void
  className?: string
}

/** The visual piece of the banner (also used by the admin live preview). */
export function PlatformNotice({ variant, message, title, onDismiss, className = "" }: PlatformNoticeProps) {
  const v = VARIANTS[variant] ?? VARIANTS.info
  const Icon = v.Icon
  return (
    <div
      role={variant === "maintenance" || variant === "warning" ? "alert" : "status"}
      className={`flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 font-mont text-sm sm:items-center sm:px-4 ${v.shell} ${className}`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${v.icon}`}>
        <Icon size={16} />
      </span>
      <p className="min-w-0 flex-1 break-words leading-snug">
        {title && <span className="mr-1.5 font-bold">{title}</span>}
        <span className={title ? "opacity-90" : "font-medium"}>{message}</span>
      </p>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className={`inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${v.close}`}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

interface Notice {
  id: string
  variant: NoticeVariant
  title?: string
  message: string
}

function noticesFor(status: PlatformStatus | null, audience: BannerAudience): Notice[] {
  if (!status) return []
  const out: Notice[] = []
  if (status.maintenance?.enabled) {
    const message = status.maintenance.message?.trim() || "Escro is undergoing scheduled maintenance. Please check back shortly."
    out.push({ id: `maintenance:${message}`, variant: "maintenance", title: "Maintenance", message })
  }
  const text = status.announcement?.text?.trim()
  if (status.announcement?.enabled && text) {
    const tone = status.announcement.tone
    const variant: AnnouncementTone = tone === "success" || tone === "warning" ? tone : "info"
    out.push({ id: `announcement:${text}`, variant, message: text })
  }
  if (status.ordersPaused && audience === "buyer") {
    out.push({ id: "orders:paused", variant: "orders", message: "New orders are paused right now. Your cart is saved — please check back soon." })
  }
  return out
}

const DISMISS_PREFIX = "escro:banner-dismissed:"

function readDismissed(ids: string[]): Set<string> {
  const set = new Set<string>()
  try {
    ids.forEach((id) => { if (sessionStorage.getItem(DISMISS_PREFIX + id)) set.add(id) })
  } catch { /* storage unavailable */ }
  return set
}

interface PlatformBannerProps {
  audience?: BannerAudience
  className?: string
}

/** Site-wide platform status banner. Renders nothing when there's nothing to say. */
export function PlatformBanner({ audience = "buyer", className = "" }: PlatformBannerProps) {
  const [status, setStatus] = useState<PlatformStatus | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())

  const load = useCallback(() => {
    platformApi.status()
      .then((data: PlatformStatus | null) => {
        setStatus(data ?? null)
        setDismissed(readDismissed(noticesFor(data ?? null, audience).map((n) => n.id)))
      })
      .catch(() => { /* keep the last known status */ })
  }, [audience])

  useEffect(() => {
    load()
    const timer = window.setInterval(load, 60_000)
    window.addEventListener(PLATFORM_STATUS_EVENT, load)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener(PLATFORM_STATUS_EVENT, load)
    }
  }, [load])

  const notices = noticesFor(status, audience).filter((n) => !dismissed.has(n.id))
  if (notices.length === 0) return null

  function dismiss(id: string) {
    try { sessionStorage.setItem(DISMISS_PREFIX + id, "1") } catch { /* ignore */ }
    setDismissed((prev) => new Set(prev).add(id))
  }

  return (
    <div className={`flex w-full flex-col gap-2 px-4 pt-3 sm:px-6 lg:px-8 ${className}`}>
      {notices.map((n) => (
        <PlatformNotice key={n.id} variant={n.variant} title={n.title} message={n.message} onDismiss={() => dismiss(n.id)} />
      ))}
    </div>
  )
}

export default PlatformBanner
