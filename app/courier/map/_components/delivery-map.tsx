"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type LngLat = [number, number]; // [lng, lat]

export interface DeliveryPoint {
  id: string;
  /** Delivery this pin belongs to (used for selection highlight). */
  groupId?: string;
  type: "pickup" | "dropoff" | "courier";
  name: string;
  address: string;
  coordinates: LngLat;
  status?: "pending" | "active" | "completed";
  isUrgent?: boolean;
  /** Rounded location (~1 km) — drawn semi-transparent. */
  approximate?: boolean;
  estimatedTime?: string;
  earnings?: string;
  phone?: string;
}

export interface MapFocus {
  coordinates: LngLat[];
  /** Change this to re-run the same focus. */
  key: number;
}

interface DeliveryMapProps {
  deliveries: DeliveryPoint[];
  courierLocation?: LngLat | null;
  onMarkerClick?: (delivery: DeliveryPoint) => void;
  /** Highlights pins whose groupId (or id) matches. */
  selectedDeliveryId?: string | null;
  showRoute?: boolean;
  /** Line drawn when showRoute is on (e.g. courier → next stop). */
  route?: LngLat[] | null;
  /** Fly/fit to these coordinates whenever `key` changes. */
  focus?: MapFocus | null;
  className?: string;
}

const DEFAULT_CENTER: LngLat = [3.3792, 6.5244]; // Lagos
const INK = "#0C110E";
const LIME = "#C8F169";

const PICKUP_SVG = (c: string) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`;
const DROPOFF_SVG = (c: string) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;

const isValid = (c: LngLat | null | undefined): c is LngLat =>
  !!c && Number.isFinite(c[0]) && Number.isFinite(c[1]);

/**
 * Marker DOM. MapLibre positions markers with `transform` on the outer element,
 * so all visual styling/animation lives on an inner element.
 */
function createMarkerElement(point: DeliveryPoint, isSelected: boolean, onClick?: () => void) {
  const el = document.createElement("div");
  el.className = "delivery-marker";
  el.style.cursor = "pointer";
  el.style.zIndex = isSelected ? "100" : "10";

  const isPickup = point.type === "pickup";
  const isCompleted = point.status === "completed";

  let bgColor: string;
  let iconColor: string;
  if (isCompleted) {
    bgColor = "#10b981";
    iconColor = "#ffffff";
  } else if (point.isUrgent) {
    bgColor = "#ef4444";
    iconColor = "#ffffff";
  } else if (isPickup) {
    bgColor = INK;
    iconColor = LIME;
  } else {
    bgColor = LIME;
    iconColor = INK;
  }

  const dot = document.createElement("div");
  dot.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${bgColor};
    border: 2px solid ${isPickup ? LIME : INK};
    box-shadow: 0 4px 14px -3px rgba(0,0,0,0.3);
    transform: scale(${isSelected ? 1.2 : 1});
    transition: transform 0.25s ease;
    opacity: ${point.approximate ? 0.75 : 1};
    ${isSelected ? "animation: escroPinPulse 2s infinite;" : ""}
  `;
  dot.innerHTML = isPickup ? PICKUP_SVG(iconColor) : DROPOFF_SVG(iconColor);
  el.appendChild(dot);

  const label = document.createElement("div");
  label.textContent = `${isPickup ? "Pickup" : "Drop-off"} · ${point.name}`;
  label.style.cssText = `
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 6px;
    padding: 4px 8px;
    background: white;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 700;
    color: ${INK};
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    opacity: ${isSelected ? 1 : 0};
    transition: opacity 0.2s;
    pointer-events: none;
  `;
  el.appendChild(label);

  el.title = point.address || point.name;
  el.addEventListener("mouseenter", () => {
    label.style.opacity = "1";
  });
  el.addEventListener("mouseleave", () => {
    if (!isSelected) label.style.opacity = "0";
  });
  if (onClick) el.addEventListener("click", onClick);
  return el;
}

function createCourierElement() {
  const el = document.createElement("div");
  el.className = "courier-marker";
  el.style.zIndex = "1000";

  const dot = document.createElement("div");
  dot.style.cssText = `
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: ${INK};
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 4px rgba(200, 241, 105, 0.55), 0 4px 14px -3px rgba(0,0,0,0.3);
    animation: escroCourierPulse 2s infinite;
  `;
  dot.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${LIME}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>`;
  el.appendChild(dot);

  const label = document.createElement("div");
  label.textContent = "You";
  label.style.cssText = `
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 6px;
    padding: 3px 10px;
    background: ${LIME};
    border-radius: 12px;
    font-size: 11px;
    font-weight: 800;
    color: ${INK};
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    pointer-events: none;
  `;
  el.appendChild(label);
  return el;
}

function fitTo(map: maplibregl.Map, coords: LngLat[], animate = true) {
  const valid = coords.filter(isValid);
  if (!valid.length) return;
  if (valid.length === 1) {
    map.flyTo({ center: valid[0], zoom: 15, duration: animate ? 900 : 0 });
    return;
  }
  const bounds = valid.reduce(
    (b, c) => b.extend(c),
    new maplibregl.LngLatBounds(valid[0], valid[0])
  );
  const container = map.getContainer();
  const pad = Math.max(30, Math.min(80, Math.round(Math.min(container.clientWidth, container.clientHeight) / 6)));
  map.fitBounds(bounds, { padding: pad, maxZoom: 16, duration: animate ? 900 : 0 });
}

const DeliveryMap = ({
  deliveries,
  courierLocation,
  onMarkerClick,
  selectedDeliveryId,
  showRoute = true,
  route,
  focus,
  className = "",
}: DeliveryMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const courierMarkerRef = useRef<maplibregl.Marker | null>(null);
  const fittedKeyRef = useRef<string | null>(null);
  const onClickRef = useRef(onMarkerClick);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    onClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  const points = useMemo(
    () => deliveries.filter((d) => d.type !== "courier" && isValid(d.coordinates)),
    [deliveries]
  );
  const courier = isValid(courierLocation ?? null) ? (courierLocation as LngLat) : null;
  const courierLng = courier?.[0];
  const courierLat = courier?.[1];

  // Initialize the map once.
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: DEFAULT_CENTER,
      zoom: 12,
      pitch: 0,
      attributionControl: { compact: true },
    });
    map.current = m;

    m.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), "top-right");
    m.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");
    m.addControl(new maplibregl.FullscreenControl(), "top-right");

    m.on("load", () => {
      m.addSource("route", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
      });
      m.addLayer({
        id: "route-outline",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": LIME, "line-width": 8, "line-opacity": 0.7 },
      });
      m.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": INK, "line-width": 4, "line-opacity": 0.85, "line-dasharray": [2, 1.5] },
      });
      setMapLoaded(true);
    });

    return () => {
      markersRef.current.forEach((mk) => mk.remove());
      markersRef.current = [];
      courierMarkerRef.current?.remove();
      courierMarkerRef.current = null;
      m.remove();
      map.current = null;
    };
  }, []);

  // Delivery pins.
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;

    markersRef.current.forEach((mk) => mk.remove());
    markersRef.current = [];

    points.forEach((point) => {
      const isSelected = !!selectedDeliveryId && (point.groupId ?? point.id) === selectedDeliveryId;
      const el = createMarkerElement(point, isSelected, () => onClickRef.current?.(point));
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat(point.coordinates)
        .addTo(m);
      markersRef.current.push(marker);
    });
  }, [points, mapLoaded, selectedDeliveryId]);

  // "You" marker.
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;
    if (courierLng == null || courierLat == null) {
      courierMarkerRef.current?.remove();
      courierMarkerRef.current = null;
      return;
    }
    if (courierMarkerRef.current) {
      courierMarkerRef.current.setLngLat([courierLng, courierLat]);
    } else {
      courierMarkerRef.current = new maplibregl.Marker({ element: createCourierElement(), anchor: "center" })
        .setLngLat([courierLng, courierLat])
        .addTo(m);
    }
  }, [courierLng, courierLat, mapLoaded]);

  // Route line.
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;
    const source = m.getSource("route") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;
    const coords = showRoute && route ? route.filter(isValid) : [];
    source.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: coords.length >= 2 ? coords : [] },
    });
  }, [route, showRoute, mapLoaded]);

  // Auto-fit when the set of pins changes (not on every GPS tick).
  const hasCourier = courierLng != null;
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;
    const key = points.map((p) => p.id).join("|") + (hasCourier ? "|you" : "");
    if (key === fittedKeyRef.current) return;
    fittedKeyRef.current = key;
    const all: LngLat[] = points.map((p) => p.coordinates);
    if (courierLng != null && courierLat != null) all.push([courierLng, courierLat]);
    fitTo(m, all);
    // courier coords intentionally read without re-triggering on every move
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, hasCourier, mapLoaded]);

  // Explicit focus requests (card clicks, "show all").
  const focusKey = focus?.key;
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded || !focus) return;
    fitTo(m, focus.coordinates);
    // only re-run when the key changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, mapLoaded]);

  return (
    <>
      <style jsx global>{`
        @keyframes escroPinPulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(200, 241, 105, 0.7), 0 4px 14px -3px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(200, 241, 105, 0), 0 8px 25px -5px rgba(0, 0, 0, 0.4);
          }
        }

        @keyframes escroCourierPulse {
          0%,
          100% {
            box-shadow: 0 0 0 4px rgba(200, 241, 105, 0.55), 0 4px 14px -3px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(200, 241, 105, 0.15), 0 4px 14px -3px rgba(0, 0, 0, 0.3);
          }
        }

        .maplibregl-ctrl-group {
          border-radius: 12px !important;
          overflow: hidden !important;
          box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.15) !important;
        }

        .maplibregl-ctrl-group button {
          width: 36px !important;
          height: 36px !important;
        }
      `}</style>
      <div
        ref={mapContainer}
        className={`h-full w-full overflow-hidden rounded-3xl ${className}`}
        style={{ minHeight: "260px" }}
      />
    </>
  );
};

export default DeliveryMap;
