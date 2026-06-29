-- =====================================================
-- V24: 비밀번호 재설정 토큰
-- =====================================================

CREATE TABLE password_reset_tokens
(
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    user_id    BIGINT       NOT NULL,
    token_hash VARCHAR(64)  NOT NULL,
    expires_at DATETIME(6)  NOT NULL,
    used_at    DATETIME(6)  NULL,
    created_at DATETIME(6)  NOT NULL,
    updated_at DATETIME(6)  NOT NULL,

    PRIMARY KEY (id),

    INDEX idx_password_reset_tokens_user_id (user_id),
    INDEX idx_password_reset_tokens_token_hash (token_hash),
    INDEX idx_password_reset_tokens_expires_at (expires_at),

    CONSTRAINT fk_password_reset_tokens_user_id
        FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
