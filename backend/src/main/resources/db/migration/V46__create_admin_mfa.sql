CREATE TABLE admin_mfa_factors (
    user_id BIGINT NOT NULL PRIMARY KEY,
    secret_encrypted TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    pending_expires_at TIMESTAMP(6) NULL,
    last_used_step BIGINT NOT NULL DEFAULT -1,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMP(6) NULL,
    recovery_hashes TEXT NOT NULL,
    CONSTRAINT fk_admin_mfa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE admin_mfa_enrollment_approvals (
    token_hash CHAR(64) NOT NULL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    consumed_at TIMESTAMP(6) NULL,
    CONSTRAINT fk_admin_mfa_approval_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_mfa_approval_expiry (expires_at)
);
CREATE TABLE admin_mfa_sessions (
    token_hash CHAR(64) NOT NULL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    access_token_hash CHAR(64) NOT NULL,
    credential_version INT NOT NULL,
    role_name VARCHAR(32) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_admin_mfa_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_mfa_session_user (user_id),
    INDEX idx_admin_mfa_session_expiry (expires_at)
);
