ALTER TABLE users
    ADD COLUMN suspended_until DATETIME NULL,
    ADD COLUMN suspension_reason VARCHAR(100) NULL,
    ADD COLUMN suspension_note TEXT NULL;

ALTER TABLE role_audit_logs
    ADD COLUMN reason VARCHAR(100) NULL,
    ADD COLUMN note TEXT NULL,
    ADD COLUMN suspended_until DATETIME NULL;
