"use client"
import React, { useState } from "react"
import { IconAlertTriangle, IconRefresh } from "@/components/icons"
import { initials, setupFile } from "./chat"

/** Round avatar with image, falling back to initials. */
export function ChatAvatar({
  name,
  avatar,
  className = "h-10 w-10 text-xs",
}: {
  name?: string | null
  avatar?: string | null
  className?: string
}) {
  const [broken, setBroken] = useState(false)
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream font-space font-bold text-ink ring-1 ring-black/5 ${className}`}
    >
      {avatar && !broken ? (
        <img src={avatar} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        initials(name)
      )}
    </span>
  )
}

/**
 * Error card. Backend errors that name a migration file ("004_services.sql", "005_agency.sql")
 * render as the amber "Database setup needed" notice.
 */
export function ChatNotice({
  message,
  title = "Something went wrong",
  onRetry,
  compact = false,
}: {
  message: string
  title?: string
  onRetry?: () => void
  compact?: boolean
}) {
  const file = setupFile(message)
  return (
    <div
      role="alert"
      className={`flex flex-col items-center rounded-3xl text-center ring-1 ${compact ? "px-4 py-8" : "px-6 py-14"} ${
        file ? "bg-amber-50 ring-amber-600/20" : "bg-white ring-black/5"
      }`}
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
          file ? "bg-amber-100 text-amber-700" : "bg-red-50 text-red-600"
        }`}
      >
        <IconAlertTriangle className="h-6 w-6" />
      </span>
      <h2 className="mt-3 text-base font-extrabold tracking-tight text-ink sm:text-lg">
        {file ? "Database setup needed" : title}
      </h2>
      <p className={`mt-1 max-w-md wrap-break-word text-sm ${file ? "text-amber-800" : "text-black/55"}`}>
        {file ? (
          <>
            Run <span className="break-all font-space">backend/database/migrations/{file}</span> in the Supabase SQL
            editor, then try again.
          </>
        ) : (
          message
        )}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
        >
          <IconRefresh className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  )
}
