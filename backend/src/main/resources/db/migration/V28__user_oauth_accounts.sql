-- 소셜 로그인 연동 (카카오·구글·네이버)
CREATE TABLE user_oauth_accounts
(
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    user_id          BIGINT       NOT NULL,
    provider         VARCHAR(20)  NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    created_at       DATETIME(6)  NOT NULL,
    updated_at       DATETIME(6)  NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_oauth_provider_user (provider, provider_user_id),
    KEY idx_oauth_user_id (user_id),
    CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
