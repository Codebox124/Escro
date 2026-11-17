"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconMap,
  IconCash,
  IconTruck,
  IconPower,
} from "@/components/icons";
import { errorMessage, setAvailability, useCourier } from "./courier-shared";

const linkCls =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-ink/15 bg-white px-5 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60";

/** Online toggle + shortcuts. Reads/writes availability via the shared courier store. */
const QuickActions = () => {
  const { isAvailable, saving } = useCourier();
  const [error, setError] = useState<string | null>(null);
  const loaded = isAvailable !== null;
  const online = isAvailable === true;

  const toggle = async () => {
    if (!loaded || saving) return;
    setError(null);
    try {
      await setAvailability(!online);
    } catch (err) {
      setError(errorMessage(err, "Couldn't update your status"));
    }
  };

  return (
    <div className="surface-card space-y-3 p-3 sm:p-4">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={!loaded || saving}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
            online ? "bg-ink text-white hover:bg-ink-soft" : "bg-lime text-ink hover:bg-lime-dark"
          }`}
        >
          <IconPower className="h-4 w-4" />
          {!loaded ? "…" : online ? "Go offline" : "Go online"}
        </button>
        <Link href="/courier/mydeliveries" className={linkCls}>
          <IconTruck className="h-4 w-4" />
          My deliveries
        </Link>
        <Link href="/courier/map" className={linkCls}>
          <IconMap className="h-4 w-4" />
          View map
        </Link>
        <Link href="/courier/earnings" className={linkCls}>
          <IconCash className="h-4 w-4" />
          Earnings
        </Link>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
};

export default QuickActions;
