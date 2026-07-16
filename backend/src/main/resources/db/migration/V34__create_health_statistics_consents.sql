CREATE TABLE health_statistics_consents (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    agreed BOOLEAN NOT NULL,
    policy_version VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_health_statistics_consents_user
        FOREIGN KEY (user_id) REFERENCES users (id),
    INDEX idx_health_statistics_consents_user_id_id (user_id, id)
);
