-- 007_wallets.sql
-- Wallet ledger: when a buyer confirms delivery (or an admin releases a disputed
-- order) the escrowed money is split between the store, the courier and Escro.
-- Each entry is one movement; a user's balance is the sum of their entries.
-- Run once in Supabase SQL Editor. Safe to re-run.

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID REFERENCES users(id) ON DELETE SET NULL,   -- NULL = Escro (platform) revenue
    type         VARCHAR(30) NOT NULL,     -- sale | delivery | commission | payout | adjustment
    amount       DECIMAL(12, 2) NOT NULL,  -- positive = credit, negative = debit
    order_id     UUID REFERENCES orders(id) ON DELETE SET NULL,
    delivery_id  UUID REFERENCES deliveries(id) ON DELETE SET NULL,
    description  TEXT,
    metadata     JSONB,
    created_at   TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_order ON wallet_transactions(order_id);

-- An order can only be settled once per share (prevents double payouts on retries)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_wallet_tx_order_share
    ON wallet_transactions(order_id, type)
    WHERE order_id IS NOT NULL AND type IN ('sale', 'delivery', 'commission');

NOTIFY pgrst, 'reload schema';
