-- 006_platform_settings.sql
-- Admin → Settings: platform-wide controls and an audit log of admin actions.
-- Run once in Supabase SQL Editor. Safe to re-run.

CREATE TABLE IF NOT EXISTS platform_settings (
    id          INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),   -- single row
    data        JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at  TIMESTAMP DEFAULT NOW()
);
INSERT INTO platform_settings (id, data) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action       VARCHAR(100) NOT NULL,          -- e.g. user.update, dispute.resolve, settings.update
    target_type  VARCHAR(50),
    target_id    VARCHAR(100),
    details      JSONB,
    created_at   TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);

NOTIFY pgrst, 'reload schema';
