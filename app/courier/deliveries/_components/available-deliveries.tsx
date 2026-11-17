"use client";

import {
  IconMapPin,
  IconClock,
  IconPackage,
  Lock,
  IconRefresh,
  IconBuildingStore,
  IconCurrentLocation,
  IconRoute,
} from "@/components/icons";
import { formatMoney } from "@/lib/money";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EmptyState,
  Shimmer,
  formatKm,
  formatMinutes,
  orderLabel,
  timeAgo,
  type Delivery,
} from "../../_components/courier-shared";

export type JobSort = "nearest" | "newest" | "fee";

interface AvailableDeliveriesProps {
  jobs: Delivery[];
  loading: boolean;
  refreshing: boolean;
  sort: JobSort;
  onSortChange: (s: JobSort) => void;
  /** The server knows where the courier is, so jobs can be sorted nearest first. */
  canSortByDistance?: boolean;
  onRefresh: () => void;
  onAccept: (id: string) => void;
  acceptingId: string | null;
  /** Timestamp used for "x min ago" labels. */
  now: number;
  /** Disable accepting (e.g. courier is offline). */
  acceptDisabled?: boolean;
}

function JobSkeleton() {
  return (
    <div className="surface-card space-y-4 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <Shimmer className="h-5 w-24" />
        <Shimmer className="h-7 w-20 rounded-full" />
      </div>
      <Shimmer className="h-12 w-full" />
      <Shimmer className="h-12 w-full" />
      <Shimmer className="h-12 w-full rounded-full" />
    </div>
  );
}

const AvailableDeliveries = ({
  jobs,
  loading,
  refreshing,
  sort,
  onSortChange,
  canSortByDistance = false,
  onRefresh,
  onAccept,
  acceptingId,
  now,
  acceptDisabled = false,
}: AvailableDeliveriesProps) => {
  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-lime px-3 font-space text-base font-bold text-ink">
            {loading ? "–" : jobs.length}
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
              Open jobs
            </h2>
            {sort === "nearest" && jobs.length > 1 && (
              <p className="inline-flex items-center gap-1 font-space text-[11px] uppercase tracking-widest text-emerald-700">
                <IconCurrentLocation className="h-3.5 w-3.5" />
                Nearest first
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => onSortChange(v as JobSort)}>
            <SelectTrigger className="h-11! min-w-0 flex-1 rounded-full border-0 bg-white px-4 ring-1 ring-black/10 focus-visible:ring-2 focus-visible:ring-lime-dark/60 sm:w-[190px] sm:flex-none">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="nearest" disabled={!canSortByDistance}>
                {canSortByDistance ? "Nearest first" : "Nearest first (needs location)"}
              </SelectItem>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="fee">Highest fee</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing || loading}
            aria-label="Refresh jobs"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border-2 border-ink/15 bg-white px-4 text-sm font-semibold text-ink hover:border-ink disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
          >
            <IconRefresh className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <JobSkeleton />
          <JobSkeleton />
          <JobSkeleton />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={IconPackage}
          title="No open jobs right now"
          body="New jobs appear when stores start preparing orders. This list refreshes automatically every 30 seconds."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => {
            const accepting = acceptingId === job.id;
            return (
              <article key={job.id} className="surface-card card-hover flex flex-col overflow-hidden">
                <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-space text-xs font-bold text-black/45">{orderLabel(job)}</p>
                      <p className="mt-1 inline-flex items-center gap-1 font-space text-[11px] text-black/50">
                        <IconClock className="h-3.5 w-3.5" />
                        Posted {timeAgo(job.createdAt, now)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-lime px-3 py-1 font-space text-sm font-bold text-ink">
                      {formatMoney(job.fee, "ngn")}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="relative space-y-3 pl-1">
                    <span
                      aria-hidden
                      className="absolute bottom-4 left-[9px] top-4 w-0.5 bg-[repeating-linear-gradient(to_bottom,rgb(12_17_14/0.25)_0_4px,transparent_4px_8px)]"
                    />
                    <div className="relative flex items-start gap-3 text-sm">
                      <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-ink bg-white" />
                      <div className="min-w-0">
                        <span className="block font-space text-[10px] uppercase tracking-widest text-black/45">
                          Pickup
                        </span>
                        <span className="flex items-center gap-1.5 font-bold text-ink">
                          {job.pickup.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={job.pickup.logo} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" />
                          ) : (
                            <IconBuildingStore className="h-4 w-4 shrink-0 text-black/40" />
                          )}
                          <span className="min-w-0 break-words">{job.pickup.name}</span>
                        </span>
                        {job.pickup.address && job.pickup.address !== job.pickup.name && (
                          <span className="block break-words text-black/55">{job.pickup.address}</span>
                        )}
                      </div>
                    </div>
                    <div className="relative flex items-start gap-3 text-sm">
                      <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-ink bg-lime" />
                      <div className="min-w-0">
                        <span className="block font-space text-[10px] uppercase tracking-widest text-black/45">
                          Drop-off area
                        </span>
                        <span className="flex items-center gap-1.5 font-bold text-ink">
                          <IconMapPin className="h-4 w-4 shrink-0 text-black/40" />
                          {job.dropoff.area || "Area not specified"}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-black/45">
                          <Lock className="h-3 w-3 shrink-0" />
                          Full address shown after you accept
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Distance */}
                  {(job.toPickupKm != null || job.distanceKm != null) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {job.toPickupKm != null && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 font-space text-[11px] font-bold text-lime">
                          <IconCurrentLocation className="h-3.5 w-3.5" />
                          {formatKm(Number(job.toPickupKm))} away
                          {job.toPickupMinutes != null
                            ? ` · ~${formatMinutes(Number(job.toPickupMinutes))}`
                            : ""}
                        </span>
                      )}
                      {job.distanceKm != null && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 font-space text-[11px] font-bold text-ink">
                          <IconRoute className="h-3.5 w-3.5" />
                          Trip ~{formatKm(Number(job.distanceKm))}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div className="flex items-center gap-2 text-sm text-black/55">
                    <IconPackage className="h-4 w-4 shrink-0 text-black/40" />
                    {job.order.itemCount} item{job.order.itemCount === 1 ? "" : "s"}
                  </div>

                  {/* Action */}
                  <div className="mt-auto pt-1">
                    <button
                      type="button"
                      onClick={() => onAccept(job.id)}
                      disabled={!!acceptingId || acceptDisabled}
                      className="h-12 w-full rounded-full bg-ink text-sm font-bold text-white transition-colors hover:bg-ink-soft disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
                    >
                      {accepting ? "Accepting…" : acceptDisabled ? "Go online to accept" : "Accept job"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AvailableDeliveries;
