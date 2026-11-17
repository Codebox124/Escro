-- 001_store_settings.sql
-- Adds the extra store settings used by My Store → Settings → General.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once.

ALTER TABLE stores ADD COLUMN IF NOT EXISTS tagline        VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS business_email VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS business_phone VARCHAR(50);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS address        TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS timezone       VARCHAR(64) DEFAULT 'africa-lagos';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS language       VARCHAR(16) DEFAULT 'en';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS currency       VARCHAR(8)  DEFAULT 'ngn';

-- Refresh the API schema cache so the new columns are visible immediately.
NOTIFY pgrst, 'reload schema';
