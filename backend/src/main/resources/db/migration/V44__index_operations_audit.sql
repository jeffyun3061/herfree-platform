-- Additive indexes support bounded time-window audit browsing; no user data is rewritten.
CREATE INDEX idx_admin_audit_created_id ON admin_audit_logs (created_at, id);
CREATE INDEX idx_role_audit_created_id ON role_audit_logs (created_at, id);
