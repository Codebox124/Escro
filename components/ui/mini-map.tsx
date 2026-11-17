"use client";

/**
 * Small, reusable MapLibre map (client only — import it with
 * `dynamic(() => import("@/components/ui/mini-map"), { ssr: false })`).
 *
 * - markers: pickup (store), dropoff (address), courier (live) or pin (draggable when onPinChange is set)
 * - line: draws a dashed line through the non-pin markers in the given order
 * - fits bounds on first load, when the set of markers changes, or when `fitKey` changes
 */

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type MiniMapMarkerKind = "pickup" | "dropoff" | "courier" | "pin";

export type MiniMapMarker = {
  lat: number;
  lng: number;
  kind: MiniMapMarkerKind;
  label?: string;
};

export type MiniMapProps = {
  markers: MiniMapMarker[];
  /** draw a line between the (non-pin) markers, in order */
  line?: boolean;
  /** makes the `pin` marker draggable (and the map clickable to move it) */
  onPinChange?: (coords: { lat: number; lng: number }) => void;
  /** change this to force a re-fit (e.g. after "use my current location") */
  fitKey?: string | number;
  className?: string;
};

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const DEFAULT_CENTER: [number, number] = [3.3792, 6.5244]; // Lagos
const INK = "#0C110E";
const LIME = "#C8F169";

const ICONS: Record<MiniMapMarkerKind, (stroke: string) => string> = {
  // storefront
  pickup: (s) =>
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V10"/><path d="M19 21V10"/><path d="M3 7l2-4h14l2 4a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M9 21v-6h6v6"/></svg>`,
  // house
  dropoff: (s) =>
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>`,
  // scooter / moving dot
  courier: (s) =>
    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M8.5 17h7"/><path d="M15 6h2l2.5 8.5"/><path d="M4 11h7l2 6"/></svg>`,
  // map pin
  pin: (s) =>
    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
};

function buildMarkerElement(kind: MiniMapMarkerKind, draggable: boolean) {
  const el = document.createElement("div");
  const size = kind === "courier" ? 38 : kind === "pin" ? 36 : 32;
  const bg = kind === "dropoff" || kind === "pin" ? LIME : INK;
  const fg = kind === "dropoff" || kind === "pin" ? INK : LIME;
  el.style.cssText = `
    position: relative;
    width: ${size}px;
    height: ${size}px;
    border-radius: 9999px;
    background: ${bg};
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #fff;
    box-shadow: ${kind === "courier" ? `0 0 0 5px rgba(200,241,105,0.55), ` : ""}0 4px 14px -3px rgba(0,0,0,0.35);
    cursor: ${draggable ? "grab" : "default"};
  `;
  const icon = document.createElement("span");
  icon.style.display = "flex";
  icon.innerHTML = ICONS[kind](fg);
  el.appendChild(icon);

  const label = document.createElement("span");
  label.dataset.role = "label";
  label.style.cssText = `
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 4px;
    padding: 2px 8px;
    border-radius: 9999px;
    background: ${kind === "courier" ? LIME : "#fff"};
    color: ${INK};
    font-size: 11px;
    font-weight: 700;
    line-height: 16px;
    white-space: nowrap;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    pointer-events: none;
  `;
  el.appendChild(label);
  return el;
}

function setLabel(el: HTMLElement, text?: string) {
  const label = el.querySelector<HTMLElement>('[data-role="label"]');
  if (!label) return;
  label.textContent = text || "";
  label.style.display = text ? "block" : "none";
}

const valid = (m: MiniMapMarker) =>
  Number.isFinite(m.lat) && Number.isFinite(m.lng) && Math.abs(m.lat) <= 90 && Math.abs(m.lng) <= 180;

export default function MiniMap({ markers, line = false, onPinChange, fitKey, className = "" }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<Map<string, maplibregl.Marker>>(new Map());
  const onPinChangeRef = useRef(onPinChange);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    onPinChangeRef.current = onPinChange;
  }, [onPinChange]);

  const points = useMemo(() => markers.filter(valid), [markers]);
  const draggable = !!onPinChange;
  // re-fit when the kinds of markers on the map change (not when a courier moves)
  const shapeKey = points.map((p) => p.kind).join(",");

  // init
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    const first = markers.find(valid);
    const map = new maplibregl.Map({
      container,
      style: STYLE_URL,
      center: first ? [first.lng, first.lat] : DEFAULT_CENTER,
      zoom: first ? 14 : 11,
      attributionControl: { compact: true },
      cooperativeGestures: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      map.addSource("mini-line", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
      });
      map.addLayer({
        id: "mini-line",
        type: "line",
        source: "mini-line",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": INK, "line-width": 3, "line-opacity": 0.75, "line-dasharray": [1.5, 1.5] },
      });
      setLoaded(true);
    });
    mapRef.current = map;
    const refs = markerRefs.current;
    return () => {
      refs.forEach((m) => m.remove());
      refs.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // click-to-move the pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !draggable) return;
    const onClick = (e: maplibregl.MapMouseEvent) => {
      onPinChangeRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    };
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [draggable]);

  // sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const refs = markerRefs.current;
    const seen = new Set<string>();
    const counts: Record<string, number> = {};
    for (const p of points) {
      const n = (counts[p.kind] = (counts[p.kind] || 0) + 1);
      const key = `${p.kind}-${n}`;
      seen.add(key);
      const isDraggable = p.kind === "pin" && draggable;
      let marker = refs.get(key);
      if (!marker || marker.isDraggable() !== isDraggable) {
        marker?.remove();
        const el = buildMarkerElement(p.kind, isDraggable);
        marker = new maplibregl.Marker({ element: el, anchor: "center", draggable: isDraggable })
          .setLngLat([p.lng, p.lat])
          .addTo(map);
        if (isDraggable) {
          const m = marker;
          m.on("dragend", () => {
            const ll = m.getLngLat();
            onPinChangeRef.current?.({ lat: ll.lat, lng: ll.lng });
          });
        }
        refs.set(key, marker);
      } else {
        marker.setLngLat([p.lng, p.lat]);
      }
      setLabel(marker.getElement(), p.label);
    }
    for (const [key, marker] of refs) {
      if (!seen.has(key)) {
        marker.remove();
        refs.delete(key);
      }
    }
  }, [points, draggable]);

  // line
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const src = map.getSource("mini-line") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    const coords = line ? points.filter((p) => p.kind !== "pin").map((p) => [p.lng, p.lat]) : [];
    src.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: coords.length >= 2 ? coords : [] },
    });
  }, [points, line, loaded]);

  // fit bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !points.length) return;
    if (points.length === 1) {
      map.easeTo({ center: [points[0].lng, points[0].lat], zoom: Math.max(map.getZoom(), 15), duration: 600 });
      return;
    }
    const bounds = new maplibregl.LngLatBounds([points[0].lng, points[0].lat], [points[0].lng, points[0].lat]);
    for (const p of points) bounds.extend([p.lng, p.lat]);
    map.fitBounds(bounds, { padding: 56, maxZoom: 16, duration: 600 });
    // only re-fit on load / marker set change / explicit fitKey — not on every position update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, shapeKey, fitKey]);

  return (
    <div
      ref={containerRef}
      className={`relative h-56 w-full overflow-hidden rounded-2xl bg-cream ring-1 ring-black/5 sm:h-64 ${className}`}
    />
  );
}
