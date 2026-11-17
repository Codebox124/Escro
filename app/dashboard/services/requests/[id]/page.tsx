"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, MessageSquare } from "@/components/icons";
import { messagesApi } from "@/services/agency";
import { formatMoney } from "@/lib/money";
import ChatConversation from "@/components/ui/chat/ChatConversation";
import { ChatAvatar, ChatNotice } from "@/components/ui/chat/ChatParts";
import { type ChatThread, type RequestStatus, errorText, formatDate } from "@/components/ui/chat/chat";
import { ProductImage, StateCard } from "../../../_components/featured-goods";

const STATUS_STYLE: Record<RequestStatus, { label: string; className: string; dot: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-800 ring-amber-600/20", dot: "bg-amber-500" },
  accepted: { label: "Accepted", className: "bg-lime text-ink ring-ink/10", dot: "bg-ink" },
  declined: { label: "Declined", className: "bg-red-50 text-red-700 ring-red-600/20", dot: "bg-red-500" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", className: "bg-black/5 text-black/55 ring-black/10", dot: "bg-black/30" },
};

function StatusPill({ status }: { status: RequestStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold ring-1 ${s.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

type LoadState = { key: string; thread: ChatThread | null; error: string | null };

export default function RequestChatPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");
  const [attempt, setAttempt] = useState(0);
  const fetchKey = `${id}:${attempt}`;
  const [state, setState] = useState<LoadState>({ key: "", thread: null, error: null });
  const [status, setStatus] = useState<RequestStatus | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    messagesApi
      .threads()
      .then((res: { threads?: ChatThread[] }) => {
        if (cancelled) return;
        const thread = (res?.threads ?? []).find((t) => String(t.requestId) === id) ?? null;
        setState({ key: fetchKey, thread, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ key: fetchKey, thread: null, error: errorText(e, "Couldn't load this conversation") });
      });
    return () => {
      cancelled = true;
    };
  }, [id, fetchKey]);

  const loading = state.key !== fetchKey;
  const thread = state.thread;
  const currentStatus = status ?? thread?.status ?? null;
  const providerName = thread?.other?.name || "Provider";

  return (
    <div className="page-container py-6 md:py-8">
      <Link
        href="/dashboard/services?tab=requests"
        className="mb-5 inline-flex h-10 items-center gap-2 rounded-full bg-white pl-2 pr-4 text-sm font-semibold text-ink ring-1 ring-black/5 transition-colors hover:ring-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cream">
          <ArrowLeft className="h-3.5 w-3.5" />
        </span>
        My requests
      </Link>

      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading conversation">
          <div className="surface-card flex animate-pulse gap-4 p-4">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-cream" />
            <div className="flex-1 space-y-2.5">
              <div className="h-4 w-1/2 rounded-full bg-black/5" />
              <div className="h-3 w-1/3 rounded-full bg-black/5" />
            </div>
          </div>
          <div className="surface-card h-[28rem] animate-pulse" />
        </div>
      ) : state.error ? (
        <ChatNotice title="Couldn't load this conversation" message={state.error} onRetry={() => setAttempt((a) => a + 1)} />
      ) : !thread ? (
        <StateCard
          tone="lime"
          icon={<MessageSquare className="h-6 w-6" />}
          title="Conversation not found"
          text="This request doesn't exist or isn't yours. Head back to your requests to pick another one."
          action={
            <Link
              href="/dashboard/services?tab=requests"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
            >
              My requests
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <header className="surface-card flex min-w-0 items-start gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-cream sm:h-16 sm:w-16">
              <ProductImage src={thread.service?.image} alt={thread.service?.title ?? "Service"} iconClassName="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-space text-[10px] uppercase tracking-widest text-black/45">Request conversation</p>
                  {thread.service ? (
                    <h1 className="mt-0.5 line-clamp-2 wrap-break-word text-lg font-extrabold leading-snug tracking-[-0.02em] text-ink sm:text-xl">
                      <Link href={`/dashboard/services/${thread.service.id}`} className="hover:underline">
                        {thread.service.title}
                      </Link>
                    </h1>
                  ) : (
                    <h1 className="mt-0.5 text-lg font-extrabold text-ink">Service unavailable</h1>
                  )}
                </div>
                {currentStatus && <StatusPill status={currentStatus} />}
              </div>
              <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-black/55">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <ChatAvatar name={providerName} avatar={thread.other?.avatar} className="h-6 w-6 text-[9px]" />
                  <span className="truncate">
                    with <span className="font-semibold text-ink">{providerName}</span>
                  </span>
                </span>
                {thread.service?.price != null && (
                  <span className="font-space font-bold text-ink">{formatMoney(thread.service.price, thread.service.currency)}</span>
                )}
                {thread.opener?.createdAt && <span>Requested {formatDate(thread.opener.createdAt)}</span>}
              </div>
            </div>
          </header>

          <div className="surface-card flex h-[calc(100dvh-19rem)] min-h-[26rem] min-w-0 flex-col overflow-hidden lg:h-[calc(100dvh-16rem)]">
            <ChatConversation
              requestId={id}
              opener={thread.opener}
              openerMine={thread.me === "customer"}
              otherName={providerName}
              status={thread.status}
              onStatusChange={setStatus}
            />
          </div>
        </div>
      )}
    </div>
  );
}
