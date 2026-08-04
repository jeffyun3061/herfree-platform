CREATE TABLE health_data_consents (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    agreed BOOLEAN NOT NULL,
    policy_version VARCHAR(20) NOT NULL,
    source VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_health_data_consents_user
        FOREIGN KEY (user_id) REFERENCES users (id),
    INDEX idx_health_data_consents_user_id_id (user_id, id)
);

-- Preserve the existing signup evidence when moving to just-in-time consent.
INSERT INTO health_data_consents (user_id, agreed, policy_version, source, created_at, updated_at)
SELECT user_id,
       sensitive_info_agreed,
       CONCAT('legacy-', privacy_version),
       'MIGRATION',
       created_at,
       updated_at
FROM user_consent_agreements;
