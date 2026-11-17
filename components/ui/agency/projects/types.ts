// Agency "Projects" = service requests on this agency's services (servicesService.incomingRequests()).
import type { RequestStatus } from "@/components/ui/chat/chat"
import { statusPill } from "../ui"

export type { RequestStatus }

export type ServiceRequest = {
  id: string
  status: RequestStatus
  message: string
  budget: number | null
  preferredDate: string | null
  contactPhone: string | null
  providerNote: string | null
  service: {
    id: string
    title: string
    price: number
    priceType: string
    currency: string
    image: string | null
    providerId: string
  } | null
  customer: { id: string; name: string | null; email: string | null; phone: string | null; avatar: string | null } | null
  createdAt: string
  updatedAt: string
}

export type ProjectFilter = "all" | "pending" | "accepted" | "completed" | "declined"

export const FILTERS: { value: ProjectFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "declined", label: "Declined" },
]

/** Which filter bucket a status falls into (customer-cancelled requests sit with declined). */
export const bucketOf = (s: RequestStatus): ProjectFilter => (s === "cancelled" ? "declined" : s)

const LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  accepted: "In progress",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
}
export const statusLabel = (s: RequestStatus) => LABELS[s] ?? s

export function requestPill(s: RequestStatus) {
  if (s === "accepted") return statusPill("in progress")
  if (s === "declined") return statusPill("cancelled")
  return statusPill(s)
}

export type Transition = "accepted" | "declined" | "completed"

/** Provider transitions allowed by the backend. */
export const TRANSITIONS: Partial<Record<RequestStatus, Transition[]>> = {
  pending: ["accepted", "declined"],
  accepted: ["completed", "declined"],
}

export const ACTION_LABEL: Record<Transition, string> = {
  accepted: "Accept",
  declined: "Decline",
  completed: "Mark completed",
}

/** Value of a request: the customer's budget, falling back to the listed price. */
export const requestValue = (r: ServiceRequest) => Number(r.budget ?? r.service?.price ?? 0) || 0

/* ---- Hand-off from Projects → Messages (which thread to open) ---- */
let pendingThread: string | null = null
export function openThreadLater(requestId: string) {
  pendingThread = requestId
}
export const peekPendingThread = () => pendingThread
export function clearPendingThread() {
  pendingThread = null
}
