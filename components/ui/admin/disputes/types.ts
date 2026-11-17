export type DisputeStatus = "open" | "resolved" | "rejected"
export type DisputeTab = DisputeStatus | "all"
export type DisputeReason = "not_received" | "not_as_described" | "damaged" | "wrong_item" | "other"
export type ResolveAction = "refund" | "release" | "reject"

export interface AdminDispute {
  id: string
  reason: DisputeReason | string
  details?: string | null
  status: DisputeStatus | string
  resolution?: string | null
  createdAt?: string | null
  resolvedAt?: string | null
  order?: { id: string; orderNumber?: string | null; status?: string | null; total?: number | null; createdAt?: string | null } | null
  store?: { id: string; name?: string | null } | null
  customer?: { id: string; name?: string | null; email?: string | null; phone?: string | null } | null
  escrow?: { status?: string | null; amount?: number | null } | null
}

export const REASON_LABELS: Record<string, string> = {
  not_received: "Item not received",
  not_as_described: "Not as described",
  damaged: "Arrived damaged",
  wrong_item: "Wrong item",
  other: "Other",
}

export const reasonLabel = (reason?: string | null) => REASON_LABELS[reason ?? ""] ?? (reason ? reason.replace(/_/g, " ") : "Other")

export const RESOLVE_OPTIONS: { value: ResolveAction; label: string; help: string }[] = [
  { value: "refund", label: "Refund buyer", help: "Returns the escrow to the buyer and marks the order refunded." },
  { value: "release", label: "Release to seller", help: "Pays the seller from escrow and completes the order." },
  { value: "reject", label: "Reject dispute", help: "Dismisses the dispute and puts the money back on hold so the buyer can still confirm delivery." },
]

const pillBase = "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold capitalize"

export function disputePill(status?: string | null) {
  switch ((status || "").toLowerCase()) {
    case "open": return `${pillBase} bg-amber-100 text-amber-800`
    case "resolved": return `${pillBase} bg-emerald-100 text-emerald-800`
    case "rejected": return `${pillBase} bg-black/5 text-black/60`
    default: return `${pillBase} bg-cream text-black/70`
  }
}

export function escrowPill(status?: string | null) {
  switch ((status || "").toLowerCase()) {
    case "held": return `${pillBase} bg-amber-100 text-amber-800`
    case "disputed": return `${pillBase} bg-red-100 text-red-700`
    case "released": return `${pillBase} bg-emerald-100 text-emerald-800`
    case "refunded": return `${pillBase} bg-sky-100 text-sky-800`
    default: return `${pillBase} bg-cream text-black/70`
  }
}

/** Optimistic shape after a resolve, used where the API response omits populated fields. */
export function applyResolution(d: AdminDispute, action: ResolveAction, note: string, returned?: Partial<AdminDispute> | null): AdminDispute {
  const escrowStatus = action === "refund" ? "refunded" : action === "release" ? "released" : "held"
  const orderStatus = action === "refund" ? "refunded" : action === "release" ? "completed" : d.order?.status
  const r = returned ?? {}
  return {
    ...d,
    status: r.status ?? (action === "reject" ? "rejected" : "resolved"),
    resolution: r.resolution ?? note,
    resolvedAt: r.resolvedAt ?? new Date().toISOString(),
    order: r.order && typeof r.order === "object" && "orderNumber" in r.order ? { ...d.order, ...r.order } : d.order ? { ...d.order, status: orderStatus } : d.order,
    escrow: r.escrow && typeof r.escrow === "object" && "status" in r.escrow ? { ...d.escrow, ...r.escrow } : d.escrow ? { ...d.escrow, status: escrowStatus } : d.escrow,
    store: r.store && typeof r.store === "object" ? r.store : d.store,
    customer: r.customer && typeof r.customer === "object" ? r.customer : d.customer,
  }
}
