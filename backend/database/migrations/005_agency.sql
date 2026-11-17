-- 005_agency.sql
-- Agency dashboard: agency profile details, courier teams, and message threads
-- on service requests. Run once in Supabase SQL Editor. Safe to re-run.

-- Agency profile details
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS phone       VARCHAR(50);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS email       VARCHAR(255);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS address     TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS website     VARCHAR(255);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS logo_url    TEXT;

-- Couriers can belong to an agency's team
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_couriers_agency ON couriers(agency_id);

-- Conversation thread on each service request (provider <-> customer)
CREATE TABLE IF NOT EXISTS service_request_messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id  UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    sender_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    body        TEXT NOT NULL,
    read_at     TIMESTAMP,
    created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_srm_request ON service_request_messages(request_id, created_at);

NOTIFY pgrst, 'reload schema';
