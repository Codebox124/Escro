"use client"
import React, { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ArrowUp, Check, IoCheckmarkDone, Loader2, Lock, MessageSquare } from "@/components/icons"
import { messagesApi } from "@/services/agency"
import {
  type ChatMessage,
  type RequestStatus,
  dayKey,
  dayLabel,
  errorText,
  formatClock,
  isClosed,
} from "./chat"
import { ChatNotice } from "./ChatParts"

const POLL_MS = 10_000

type Pending = { id: string; body: string; createdAt: string; state: "sending" | "failed"; error?: string }

type Item =
  | { kind: "opener"; id: string; body: string; createdAt: string; mine: boolean }
  | { kind: "message"; id: string; body: string; createdAt: string; mine: boolean; readAt?: string | null }
  | { kind: "pending"; id: string; body: string; createdAt: string; mine: true; state: Pending["state"]; error?: string }

export type ChatConversationProps = {
  requestId: string
  /** The customer's original request message — rendered as the first bubble. */
  opener?: { body: string; createdAt: string } | null
  /** True when the viewer is the one who wrote the opener (i.e. the customer). */
  openerMine?: boolean
  /** Name of the other party (for labels / screen readers). */
  otherName?: string | null
  /** Initial request status; refreshed from the messages endpoint. */
  status?: RequestStatus | null
  onStatusChange?: (status: RequestStatus) => void
  /** Called after a message is sent or new messages arrive (lets parents refresh thread lists). */
  onActivity?: () => void
  /** Optional header rendered above the message list. */
  header?: React.ReactNode
  className?: string
}

/** Conversation on a single service request: history, 10s polling, optimistic composer. */
export default function ChatConversation(props: ChatConversationProps) {
  // Re-mount per request so all local state resets cleanly when switching threads.
  return <ConversationInner key={props.requestId} {...props} />
}

function ConversationInner({
  requestId,
  opener,
  openerMine = false,
  otherName,
  status: initialStatus,
  onStatusChange,
  onActivity,
  header,
  className = "",
}: ChatConversationProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pending, setPending] = useState<Pending[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<RequestStatus | null>(initialStatus ?? null)
  const [draft, setDraft] = useState("")
  const [attempt, setAttempt] = useState(0)

  const scrollRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)
  const lastCountRef = useRef(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Keep callbacks in refs so polling doesn't restart when parents re-render.
  const onStatusRef = useRef(onStatusChange)
  const onActivityRef = useRef(onActivity)
  useEffect(() => {
    onStatusRef.current = onStatusChange
    onActivityRef.current = onActivity
  })

  const countRef = useRef<number | null>(null)
  const statusRef = useRef<RequestStatus | null>(initialStatus ?? null)

  const applyResponse = useCallback((res: { messages?: ChatMessage[]; requestStatus?: RequestStatus } | null) => {
    const list = Array.isArray(res?.messages) ? res.messages : []
    const prevCount = countRef.current
    countRef.current = list.length
    setMessages(list)
    if (prevCount !== null && prevCount !== list.length) onActivityRef.current?.()
    const next = res?.requestStatus
    if (next && next !== statusRef.current) {
      statusRef.current = next
      setStatus(next)
      onStatusRef.current?.(next)
    }
  }, [])

  // Initial load (and manual retries)
  useEffect(() => {
    let cancelled = false
    messagesApi
      .messages(requestId)
      .then((res: { messages?: ChatMessage[]; requestStatus?: RequestStatus }) => {
        if (cancelled) return
        applyResponse(res)
        setError(null)
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(errorText(e, "Couldn't load this conversation"))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [requestId, attempt, applyResponse])

  // Poll for new messages while open
  useEffect(() => {
    if (error) return
    let cancelled = false
    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return
      messagesApi
        .messages(requestId)
        .then((res: { messages?: ChatMessage[]; requestStatus?: RequestStatus }) => {
          if (!cancelled) applyResponse(res)
        })
        .catch(() => {
          /* transient poll errors are ignored; the next tick retries */
        })
    }, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [requestId, error, applyResponse])

  const items = useMemo<Item[]>(() => {
    const out: Item[] = []
    if (opener?.body) out.push({ kind: "opener", id: "opener", body: opener.body, createdAt: opener.createdAt, mine: openerMine })
    const sorted = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    sorted.forEach((m) => out.push({ kind: "message", id: m.id, body: m.body, createdAt: m.createdAt, mine: !!m.mine, readAt: m.readAt }))
    pending.forEach((p) => out.push({ kind: "pending", id: p.id, body: p.body, createdAt: p.createdAt, mine: true, state: p.state, error: p.error }))
    return out
  }, [opener, openerMine, messages, pending])

  // Auto-scroll: on first render and whenever new items arrive while at the bottom (or I sent one).
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const grew = items.length > lastCountRef.current
    const first = lastCountRef.current === 0
    const lastMine = items[items.length - 1]?.mine
    lastCountRef.current = items.length
    if (first || (grew && (atBottomRef.current || lastMine))) el.scrollTop = el.scrollHeight
  }, [items, loading])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  const closed = isClosed(status)

  const deliver = async (id: string, body: string) => {
    try {
      const msg = (await messagesApi.send(requestId, body)) as ChatMessage
      setPending((p) => p.filter((x) => x.id !== id))
      if (msg && msg.id) {
        setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, { ...msg, mine: true }]))
        // Our own message shouldn't count as "new activity" on the next poll.
        countRef.current = (countRef.current ?? 0) + 1
      }
      onActivityRef.current?.()
    } catch (e) {
      setPending((p) => p.map((x) => (x.id === id ? { ...x, state: "failed", error: errorText(e, "Not sent") } : x)))
      // The request may have been closed in the meantime — refresh the status.
      messagesApi
        .messages(requestId)
        .then((res: { messages?: ChatMessage[]; requestStatus?: RequestStatus }) => applyResponse(res))
        .catch(() => {})
    }
  }

  const submit = () => {
    const body = draft.trim()
    if (!body || closed) return
    const id = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setPending((p) => [...p, { id, body, createdAt: new Date().toISOString(), state: "sending" }])
    setDraft("")
    atBottomRef.current = true
    void deliver(id, body)
    textareaRef.current?.focus()
  }

  const retry = (p: Pending | Extract<Item, { kind: "pending" }>) => {
    setPending((list) => list.map((x) => (x.id === p.id ? { ...x, state: "sending", error: undefined } : x)))
    void deliver(p.id, p.body)
  }
  const discard = (id: string) => setPending((list) => list.filter((x) => x.id !== id))

  // Auto-grow textarea
  useLayoutEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [draft])

  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${className}`}>
      {header}

      <div
        ref={scrollRef}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-label={otherName ? `Conversation with ${otherName}` : "Conversation"}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-cream/50 px-3 py-4 sm:px-5"
      >
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
                <div className={`h-12 animate-pulse rounded-2xl ${i % 2 ? "w-1/2 bg-ink/10" : "w-2/3 bg-white"}`} />
              </div>
            ))}
          </div>
        ) : error ? (
          <ChatNotice compact title="Couldn't load this conversation" message={error} onRetry={() => setAttempt((a) => a + 1)} />
        ) : items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ink ring-1 ring-black/5">
              <MessageSquare className="h-5 w-5" />
            </span>
            <p className="font-bold text-ink">No messages yet</p>
            <p className="max-w-xs text-sm text-black/55">Say hello to get the conversation started.</p>
          </div>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {items.map((it, i) => {
              const prev = items[i - 1]
              const newDay = !prev || dayKey(prev.createdAt) !== dayKey(it.createdAt)
              const groupedWithPrev = !newDay && prev && prev.mine === it.mine && prev.kind !== "opener"
              return (
                <Fragment key={it.id}>
                  {newDay && (
                    <li role="separator" className="my-3 flex items-center gap-3" aria-label={dayLabel(it.createdAt)}>
                      <span className="h-px flex-1 bg-black/10" />
                      <span className="rounded-full bg-white px-3 py-1 font-space text-[10px] font-bold uppercase tracking-widest text-black/50 ring-1 ring-black/5">
                        {dayLabel(it.createdAt)}
                      </span>
                      <span className="h-px flex-1 bg-black/10" />
                    </li>
                  )}
                  <Bubble item={it} grouped={!!groupedWithPrev} onRetry={retry} onDiscard={discard} />
                </Fragment>
              )
            })}
          </ol>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-black/5 bg-white p-3 sm:p-4">
        {closed ? (
          <p className="flex items-center gap-2 rounded-2xl bg-cream px-4 py-3 text-sm text-black/60">
            <Lock className="h-4 w-4 shrink-0" />
            This request was {status === "cancelled" ? "cancelled" : "declined"}, so new messages are turned off.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
            className="flex items-end gap-2"
          >
            <label htmlFor={`chat-composer-${requestId}`} className="sr-only">
              Write a message
            </label>
            <textarea
              id={`chat-composer-${requestId}`}
              ref={textareaRef}
              rows={1}
              value={draft}
              disabled={!!error || loading}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  submit()
                }
              }}
              placeholder="Write a message…"
              maxLength={4000}
              className="max-h-40 min-h-11 min-w-0 flex-1 resize-none rounded-3xl border-0 bg-cream px-4 py-3 text-sm leading-5 text-ink placeholder:text-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!draft.trim() || !!error || loading}
              aria-label="Send message"
              className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-ink text-lime transition-all hover:bg-ink-soft active:scale-95 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 focus-visible:ring-offset-2"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </form>
        )}
        {!closed && (
          <p className="mt-1.5 hidden px-2 text-[11px] text-black/40 sm:block">Enter to send · Shift + Enter for a new line</p>
        )}
      </div>
    </div>
  )
}

function Bubble({
  item,
  grouped,
  onRetry,
  onDiscard,
}: {
  item: Item
  grouped: boolean
  onRetry: (p: Extract<Item, { kind: "pending" }>) => void
  onDiscard: (id: string) => void
}) {
  const mine = item.mine
  const failed = item.kind === "pending" && item.state === "failed"
  return (
    <li className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"} ${grouped ? "" : "mt-2"}`}>
      {item.kind === "opener" && (
        <span className="mb-1 px-1 font-space text-[10px] font-bold uppercase tracking-widest text-emerald-700">
          Original request
        </span>
      )}
      <div
        className={`max-w-[85%] whitespace-pre-wrap wrap-break-word px-4 py-2.5 text-sm leading-relaxed sm:max-w-[75%] ${
          mine
            ? `rounded-2xl rounded-br-md bg-ink text-white ${item.kind === "pending" && !failed ? "opacity-70" : ""} ${failed ? "ring-2 ring-red-400" : ""}`
            : "rounded-2xl rounded-bl-md bg-white text-ink ring-1 ring-black/5"
        } ${item.kind === "opener" ? (mine ? "border-l-4 border-lime" : "border-l-4 border-emerald-500") : ""}`}
      >
        {item.body}
      </div>
      <div className={`mt-1 flex items-center gap-1.5 px-1 text-[11px] text-black/45 ${mine ? "flex-row-reverse" : ""}`}>
        {item.kind === "pending" ? (
          item.state === "sending" ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Sending…
            </span>
          ) : (
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-red-600" role="alert">
              <span className="max-w-56 truncate" title={item.error}>
                Not sent{item.error ? ` · ${item.error}` : ""}
              </span>
              <button type="button" onClick={() => onRetry(item)} className="cursor-pointer font-bold underline underline-offset-2 hover:text-red-800">
                Retry
              </button>
              <button type="button" onClick={() => onDiscard(item.id)} className="cursor-pointer font-bold text-black/50 underline underline-offset-2 hover:text-ink">
                Remove
              </button>
            </span>
          )
        ) : (
          <>
            <time dateTime={item.createdAt}>{formatClock(item.createdAt)}</time>
            {item.kind === "message" && mine && (
              item.readAt ? (
                <IoCheckmarkDone className="h-3.5 w-3.5 text-emerald-600" aria-label="Read" />
              ) : (
                <Check className="h-3 w-3" aria-label="Sent" />
              )
            )}
          </>
        )}
      </div>
    </li>
  )
}
