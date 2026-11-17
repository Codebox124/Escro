-- 002_store_payment_shipping.sql
-- Stores the seller's Payment and Shipping settings (My Store → Settings).
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once.

ALTER TABLE stores ADD COLUMN IF NOT EXISTS payment_settings  JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS shipping_settings JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Refresh the API schema cache so the new columns are visible immediately.
NOTIFY pgrst, 'reload schema';
