// backend/utils/geo.js
// Geocoding (address → coordinates) and distance helpers for delivery maps.
//
// Geocoding uses OpenStreetMap's Nominatim service (free; max ~1 request/second
// per its usage policy). Results are cached in the geocode_cache table so each
// address is looked up once. Exact GPS pins from the buyer/seller always win
// over geocoded addresses.

const { supabaseAdmin } = require('../config/supabase');

const NOMINATIM_URL = process.env.GEOCODER_URL || 'https://nominatim.openstreetmap.org/search';
// Nominatim asks every app to identify itself; this is the app name only.
const USER_AGENT = 'Escro-Marketplace/1.0';
const AVG_CITY_SPEED_KMH = 20; // rough motorbike speed in city traffic, for ETAs

const isMissing = (e) => e && (e.code === 'PGRST205' || e.code === '42P01' || e.code === '42703' || e.code === 'PGRST204');
const validCoord = (lat, lng) =>
  Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) &&
  Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180 && !(Number(lat) === 0 && Number(lng) === 0);

let lastRequestAt = 0;
async function throttle() {
  const wait = lastRequestAt + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

const normalizeQuery = (q) => String(q || '').trim().replace(/\s+/g, ' ').toLowerCase().slice(0, 300);

/** Address → { lat, lng } or null. Cached; never throws. */
async function geocode(address) {
  const query = normalizeQuery(address);
  if (query.length < 4) return null;
  try {
    const { data: cached, error } = await supabaseAdmin
      .from('geocode_cache')
      .select('lat, lng')
      .eq('query', query)
      .maybeSingle();
    if (!error && cached) return cached.lat != null ? { lat: cached.lat, lng: cached.lng } : null;

    await throttle();
    const url = `${NOMINATIM_URL}?format=jsonv2&limit=1&countrycodes=ng&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (!res.ok) return null;
    const results = await res.json();
    const hit = Array.isArray(results) && results[0];
    const point = hit && validCoord(hit.lat, hit.lon) ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;

    // cache hits and misses (misses stop us asking again for an unknown address)
    if (!isMissing(error)) {
      await supabaseAdmin
        .from('geocode_cache')
        .upsert({ query, lat: point?.lat ?? null, lng: point?.lng ?? null, display_name: hit?.display_name || null });
    }
    return point;
  } catch (e) {
    console.error('geocode failed', e?.message || e);
    return null;
  }
}

/** Great-circle distance in km. */
function haversineKm(a, b) {
  if (!a || !b) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Road distance is roughly 1.3× the straight line in cities. */
const roadKm = (a, b) => {
  const d = haversineKm(a, b);
  return d == null ? null : Math.round(d * 1.3 * 10) / 10;
};
const etaMinutes = (km) => (km == null ? null : Math.max(5, Math.round((km / AVG_CITY_SPEED_KMH) * 60)));

/**
 * Fill in pickup/drop-off coordinates, distance and ETA for a delivery if they're
 * missing. Uses exact pins (store lat/lng, order shipping lat/lng) first, then
 * geocodes the text addresses. Returns the updated fields (or {}). Never throws.
 */
async function ensureDeliveryCoords(deliveryId) {
  try {
    const { data: d, error } = await supabaseAdmin
      .from('deliveries')
      .select(`id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, pickup_address, delivery_address,
        orders ( shipping_lat, shipping_lng, shipping_city, shipping_state, stores ( lat, lng, address, store_name ) )`)
      .eq('id', deliveryId)
      .maybeSingle();
    if (error || !d) return {};

    const updates = {};
    let pickup = validCoord(d.pickup_lat, d.pickup_lng) ? { lat: d.pickup_lat, lng: d.pickup_lng } : null;
    let dropoff = validCoord(d.dropoff_lat, d.dropoff_lng) ? { lat: d.dropoff_lat, lng: d.dropoff_lng } : null;

    if (!pickup) {
      const store = d.orders?.stores;
      pickup = store && validCoord(store.lat, store.lng)
        ? { lat: store.lat, lng: store.lng }
        : (await geocode(store?.address)) || (await geocode(d.pickup_address));
      if (pickup) Object.assign(updates, { pickup_lat: pickup.lat, pickup_lng: pickup.lng });
    }
    if (!dropoff) {
      const o = d.orders;
      dropoff = o && validCoord(o.shipping_lat, o.shipping_lng)
        ? { lat: o.shipping_lat, lng: o.shipping_lng }
        : (await geocode(d.delivery_address)) || (await geocode([o?.shipping_city, o?.shipping_state, 'Nigeria'].filter(Boolean).join(', ')));
      if (dropoff) Object.assign(updates, { dropoff_lat: dropoff.lat, dropoff_lng: dropoff.lng });
    }
    if (pickup && dropoff && Object.keys(updates).length) {
      const km = roadKm(pickup, dropoff);
      updates.distance_km = km;
      updates.estimated_time = etaMinutes(km);
    }
    if (Object.keys(updates).length) {
      updates.updated_at = new Date().toISOString();
      const { error: e } = await supabaseAdmin.from('deliveries').update(updates).eq('id', d.id);
      if (e && !isMissing(e)) console.error('saving delivery coords failed', e.message);
    }
    return updates;
  } catch (e) {
    console.error('ensureDeliveryCoords failed', e?.message || e);
    return {};
  }
}

module.exports = { geocode, haversineKm, roadKm, etaMinutes, validCoord, ensureDeliveryCoords };

// Whether migration 008 (coordinate columns) has been run. Cached for a minute.
let mapsReadyCache = { at: 0, value: false };
async function mapsReady() {
  if (Date.now() - mapsReadyCache.at < 60 * 1000) return mapsReadyCache.value;
  const { error } = await supabaseAdmin.from('deliveries').select('pickup_lat').limit(1);
  mapsReadyCache = { at: Date.now(), value: !error };
  return mapsReadyCache.value;
}

module.exports.mapsReady = mapsReady;
