-- 003_customer_flow.sql
-- Tables for the buyer flow: cart, saved delivery addresses and order disputes.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS cart_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE (customer_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_cart_items_customer ON cart_items(customer_id);

CREATE TABLE IF NOT EXISTS customer_addresses (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       VARCHAR(50),
    full_name   VARCHAR(255) NOT NULL,
    phone       VARCHAR(50) NOT NULL,
    address     TEXT NOT NULL,
    city        VARCHAR(100) NOT NULL,
    state       VARCHAR(100) NOT NULL,
    zip         VARCHAR(20),
    country     VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);

CREATE TABLE IF NOT EXISTS order_disputes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason      VARCHAR(100) NOT NULL,
    details     TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'open',  -- open | resolved | rejected
    resolution  TEXT,
    created_at  TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_disputes_order ON order_disputes(order_id);

-- Refresh the API schema cache so the new tables are visible immediately.
NOTIFY pgrst, 'reload schema';
