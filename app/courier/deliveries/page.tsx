"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconPower, IconArrowRight, IconCircleCheck } from "@/components/icons";
import AvailableDeliveries, { type JobSort } from "./_components/available-deliveries";
import {
  api,
  ErrorState,
  errorMessage,
  setAvailability,
  syncAvailability,
  useCourier,
  type Delivery,
} from "../_components/courier-shared";

const REFRESH_MS = 30_000;

type Notice =
  | { kind: "success"; text: string }
  | { kind: "taken"; text: string }
  | { kind: "offline"; text: string }
  | { kind: "error"; text: string };

const Page = () => {
  const router = useRouter();
  const { isAvailable, saving } = useCourier();

  const [jobs, setJobs] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [sort, setSort] = useState<JobSort>("newest");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const loadedOnce = useRef(false);

  const load = useCallback(async (mode: "initial" | "manual" | "silent") => {
    if (mode === "initial") setLoading(true);
    if (mode === "manual") setRefreshing(true);
    try {
      const data = await api.jobs();
      setJobs(data?.jobs ?? []);
      setError(null);
      loadedOnce.current = true;
    } catch (err) {
      // Keep showing the last list on a failed background refresh.
      if (mode !== "silent" || !loadedOnce.current) {
        setError(errorMessage(err, "Couldn't load open jobs"));
      }
    } finally {
      setNow(Date.now());
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load("initial");
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void load("silent");
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (notice?.kind !== "success") return;
    const t = setTimeout(() => router.push("/courier/mydeliveries"), 1500);
    return () => clearTimeout(t);
  }, [notice, router]);

  const sorted = useMemo(() => {
    const list = [...jobs];
    if (sort === "fee") list.sort((a, b) => b.fee - a.fee);
    else
      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    return list;
  }, [jobs, sort]);

  const handleAccept = async (id: string) => {
    setAcceptingId(id);
    setNotice(null);
    try {
      const delivery = await api.accept(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setNotice({
        kind: "success",
        text: `Job accepted${delivery?.pickup?.name ? ` — head to ${delivery.pickup.name}` : ""}. Opening your deliveries…`,
      });
    } catch (err) {
      const msg = errorMessage(err, "Couldn't accept this job");
      if (/taken/i.test(msg)) {
        setJobs((prev) => prev.filter((j) => j.id !== id));
        setNotice({ kind: "taken", text: "Too slow — another courier just took that job." });
      } else if (/go online/i.test(msg)) {
        // Server says we're offline — reflect it everywhere (navbar toggle + banner).
        syncAvailability(false);
        setNotice({ kind: "offline", text: msg });
      } else {
        setNotice({ kind: "error", text: msg });
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const goOnline = async () => {
    try {
      await setAvailability(true);
      setNotice(null);
    } catch (err) {
      setNotice({ kind: "error", text: errorMessage(err, "Couldn't go online") });
    }
  };

  const offline = isAvailable === false;

  return (
    <div className="min-h-full bg-app py-5 sm:py-8">
      <div className="page-container space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div>
          <p className="eyebrow font-space text-emerald-700">Job board</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
            Available jobs
          </h1>
          <p className="mt-1.5 text-sm text-black/55 sm:text-base">
            Accept a job to see the full drop-off address and customer contact.
          </p>
        </div>

        {offline && (
          <div className="flex flex-col gap-3 rounded-3xl bg-ink p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70">
                <IconPower className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-bold">
                  {notice?.kind === "offline"
                    ? notice.text
                    : "You're offline — go online to accept jobs"}
                </p>
                <p className="text-sm text-white/55">
                  Use the power button at the top, or go online here.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={goOnline}
              disabled={saving}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-ink hover:bg-lime-dark disabled:opacity-60"
            >
              <IconPower className="h-4 w-4" />
              {saving ? "Going online…" : "Go online"}
            </button>
          </div>
        )}

        {notice?.kind === "success" && (
          <div
            role="status"
            className="flex flex-col gap-3 rounded-3xl bg-lime p-4 text-ink sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="flex items-start gap-2 font-semibold">
              <IconCircleCheck className="mt-0.5 h-5 w-5 shrink-0" />
              {notice.text}
            </p>
            <Link
              href="/courier/mydeliveries"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white"
            >
              My deliveries
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {(notice?.kind === "taken" || notice?.kind === "error") && (
          <ErrorState message={notice.text} />
        )}

        {error && !loading ? (
          <ErrorState message={error} onRetry={() => void load("manual")} />
        ) : (
          <AvailableDeliveries
            jobs={sorted}
            loading={loading}
            refreshing={refreshing}
            sort={sort}
            onSortChange={setSort}
            onRefresh={() => void load("manual")}
            onAccept={handleAccept}
            acceptingId={acceptingId}
            now={now}
            acceptDisabled={offline || notice?.kind === "success"}
          />
        )}
      </div>
    </div>
  );
};

export default Page;
