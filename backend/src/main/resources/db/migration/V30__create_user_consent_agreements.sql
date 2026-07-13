CREATE TABLE user_consent_agreements
(
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT      NOT NULL,
    terms_version   VARCHAR(20) NOT NULL,
    privacy_version VARCHAR(20) NOT NULL,
    age_confirmed   BOOLEAN     NOT NULL,
    marketing_agreed BOOLEAN    NOT NULL,
    created_at      DATETIME(6) NOT NULL,
    updated_at      DATETIME(6) NOT NULL,
    INDEX idx_user_consent_agreements_user_id (user_id),
    CONSTRAINT fk_user_consent_agreements_user_id
        FOREIGN KEY (user_id) REFERENCES users (id)
);
