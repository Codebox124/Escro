"use client";

import { useEffect } from "react";
import {
  api,
  haversineKm,
  isMapsMigrationError,
  setCourierLocation,
  useCourier,
} from "./courier-shared";

const MIN_SEND_MS = 30_000; // never report more often than this
const HEARTBEAT_MS = 120_000; // report even when standing still
const MOVE_KM = 0.05; // ~50 m counts as real movement

/**
 * Shares the courier's live position while they're online.
 * Renders nothing; the latest position is exposed via useCourierLocation().
 */
export default function LocationTracker() {
  const { isAvailable } = useCourier();

  useEffect(() => {
    if (isAvailable !== true) {
      setCourierLocation({ position: null });
      return;
    }
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setCourierLocation({ permission: "unsupported" });
      return;
    }

    let cancelled = false;
    let stopSending = false; // set when the server can't store locations yet
    let sending = false;
    let latest: { lat: number; lng: number } | null = null;
    let lastSent: { lat: number; lng: number; at: number } | null = null;

    const maybeSend = () => {
      if (cancelled || stopSending || sending || !latest) return;
      const now = Date.now();
      if (lastSent) {
        const elapsed = now - lastSent.at;
        if (elapsed < MIN_SEND_MS) return;
        const moved = haversineKm(lastSent, latest) >= MOVE_KM;
        if (!moved && elapsed < HEARTBEAT_MS) return;
      }
      const pos = latest;
      sending = true;
      api
        .updateLocation(pos.lat, pos.lng)
        .then(() => {
          lastSent = { ...pos, at: Date.now() };
        })
        .catch((err) => {
          if (isMapsMigrationError(err)) {
            stopSending = true;
            setCourierLocation({ migrationNeeded: true });
          } else {
            // Network hiccup etc. — try again on the next tick, not immediately.
            lastSent = lastSent ? { ...lastSent, at: Date.now() } : { ...pos, at: Date.now() };
          }
        })
        .finally(() => {
          sending = false;
        });
    };

    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        if (cancelled) return;
        latest = { lat: p.coords.latitude, lng: p.coords.longitude };
        setCourierLocation({
          permission: "granted",
          position: {
            ...latest,
            accuracy: Number.isFinite(p.coords.accuracy) ? p.coords.accuracy : null,
            at: p.timestamp || Date.now(),
          },
        });
        maybeSend();
      },
      (err) => {
        if (cancelled) return;
        if (err.code === err.PERMISSION_DENIED) {
          setCourierLocation({ permission: "denied", position: null });
          navigator.geolocation.clearWatch(watchId);
        }
        // POSITION_UNAVAILABLE / TIMEOUT: keep watching, the browser retries.
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 30_000 }
    );

    // watchPosition only fires on movement, so also check periodically.
    const tick = setInterval(maybeSend, MIN_SEND_MS);

    return () => {
      cancelled = true;
      clearInterval(tick);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isAvailable]);

  return null;
}
