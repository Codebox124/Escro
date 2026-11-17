// Shared className tokens for the admin dashboard (kept in sync with components/ui/agency/ui.ts)
// Cream / Ink / Lime language — matches the public landing page.

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"

export const btnPrimary = `inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white transition-all hover:bg-ink-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/40 [&_svg]:text-lime ${focusRing}`

export const btnAccent = `inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-ink transition-all hover:bg-lime-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`

export const btnSecondary = `inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-ink/15 bg-transparent px-5 text-sm font-bold text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`

export const btnDanger = `inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-bold text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/40 ${focusRing}`

export const btnGhostIcon = `inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-black/60 transition-colors hover:bg-cream hover:text-ink ${focusRing}`

/** Small "View all" style link pill used in card headers */
export const linkPill = `inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-cream px-3.5 text-xs font-bold text-ink transition-colors hover:bg-lime ${focusRing}`

export const inputBase = `h-11 w-full rounded-2xl border-0 bg-white px-4 text-sm text-ink shadow-none ring-1 ring-black/10 placeholder:text-black/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink`

export const searchInput = `h-11 w-full rounded-full border-0 bg-white px-4 text-sm text-ink shadow-none ring-1 ring-black/10 placeholder:text-black/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink`

export const selectTrigger = `w-full rounded-full border-0 bg-white px-4 text-sm font-medium text-ink shadow-none ring-1 ring-black/10 data-[size=default]:h-11 focus-visible:ring-2 focus-visible:ring-ink sm:w-48`

export const filterBar = "surface-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4"

export const modalOverlay = "fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"

export const modalPanel = "flex max-h-[90dvh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white shadow-[0_40px_80px_-30px_rgba(12,17,14,0.5)] ring-1 ring-black/5 sm:max-w-lg sm:rounded-3xl"

export const pageWrapper = "mx-auto flex w-full max-w-[96rem] flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8"

/** Card section title + subtitle */
export const cardTitle = "text-lg font-extrabold tracking-[-0.02em] text-ink"
export const cardSubtitle = "mt-0.5 text-sm text-black/55"

/** Icon tile inside white cards */
export const iconTile = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-ink"

/** Mono small uppercase label */
export const monoLabel = "font-space text-[11px] uppercase tracking-widest text-black/45"

export function statusPill(status: string) {
  const s = (status || "").toLowerCase()
  const base = "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold"
  if (["active", "completed", "resolved", "verified"].includes(s)) return `${base} bg-emerald-100 text-emerald-800`
  if (["in progress", "processing"].includes(s)) return `${base} bg-sky-100 text-sky-800`
  if (["pending"].includes(s)) return `${base} bg-amber-100 text-amber-800`
  if (["banned", "cancelled", "failed", "inactive", "unverified"].includes(s)) return `${base} bg-red-100 text-red-700`
  return `${base} bg-cream text-black/70`
}
