-- 008_maps.sql
-- Coordinates for live delivery maps: pickup/drop-off pins, courier live
-- location, exact GPS pins for addresses and stores, and a geocoding cache.
-- Run once in Supabase SQL Editor. Safe to re-run.

ALTER TABLE deliveries         ADD COLUMN IF NOT EXISTS pickup_lat   DOUBLE PRECISION;
ALTER TABLE deliveries         ADD COLUMN IF NOT EXISTS pickup_lng   DOUBLE PRECISION;
ALTER TABLE deliveries         ADD COLUMN IF NOT EXISTS dropoff_lat  DOUBLE PRECISION;
ALTER TABLE deliveries         ADD COLUMN IF NOT EXISTS dropoff_lng  DOUBLE PRECISION;

ALTER TABLE couriers           ADD COLUMN IF NOT EXISTS last_lat     DOUBLE PRECISION;
ALTER TABLE couriers           ADD COLUMN IF NOT EXISTS last_lng     DOUBLE PRECISION;
ALTER TABLE couriers           ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP;

ALTER TABLE orders             ADD COLUMN IF NOT EXISTS shipping_lat DOUBLE PRECISION;
ALTER TABLE orders             ADD COLUMN IF NOT EXISTS shipping_lng DOUBLE PRECISION;

ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS lat          DOUBLE PRECISION;
ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS lng          DOUBLE PRECISION;

ALTER TABLE stores             ADD COLUMN IF NOT EXISTS lat          DOUBLE PRECISION;
ALTER TABLE stores             ADD COLUMN IF NOT EXISTS lng          DOUBLE PRECISION;

-- Address → coordinates lookups, so each address is only geocoded once
CREATE TABLE IF NOT EXISTS geocode_cache (
    query        TEXT PRIMARY KEY,
    lat          DOUBLE PRECISION,
    lng          DOUBLE PRECISION,
    display_name TEXT,
    created_at   TIMESTAMP DEFAULT NOW()
);

NOTIFY pgrst, 'reload schema';
