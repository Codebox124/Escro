-- 004_services.sql
-- Services marketplace: providers (agencies / sellers) list services,
-- customers send requests. Run once in Supabase SQL Editor. Safe to re-run.

CREATE TABLE IF NOT EXISTS services (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    category       VARCHAR(100) NOT NULL DEFAULT 'other',
    price          DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    price_type     VARCHAR(20) NOT NULL DEFAULT 'fixed',   -- fixed | starting_at | hourly
    currency       VARCHAR(8) NOT NULL DEFAULT 'ngn',
    delivery_time  VARCHAR(50),                            -- e.g. "2-3 days"
    location       VARCHAR(255),                           -- e.g. "Lagos" or "Remote"
    image_url      TEXT,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    rating         DECIMAL(3, 2) DEFAULT 0,
    total_reviews  INTEGER DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    created_at     TIMESTAMP DEFAULT NOW(),
    updated_at     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

CREATE TABLE IF NOT EXISTS service_requests (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id     UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    customer_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message        TEXT NOT NULL,
    budget         DECIMAL(12, 2),
    preferred_date DATE,
    contact_phone  VARCHAR(50),
    status         VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | accepted | declined | completed | cancelled
    provider_note  TEXT,
    created_at     TIMESTAMP DEFAULT NOW(),
    updated_at     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_service_requests_service ON service_requests(service_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer ON service_requests(customer_id);

NOTIFY pgrst, 'reload schema';
