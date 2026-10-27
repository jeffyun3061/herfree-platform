-- New consent provenance only. Existing posts/comments remain NULL and unchanged.
CREATE TABLE community_health_consents (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    agreed BOOLEAN NOT NULL,
    policy_version VARCHAR(20) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    decided_at TIMESTAMP(6) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_community_health_consent_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_community_health_consent_user (user_id, id)
);
ALTER TABLE posts ADD COLUMN community_health_consent_id BIGINT NULL,
    ADD COLUMN row_version BIGINT NOT NULL DEFAULT 0,
    ADD CONSTRAINT fk_post_community_health_consent FOREIGN KEY (community_health_consent_id) REFERENCES community_health_consents(id),
    ADD INDEX idx_post_community_health_consent (user_id, community_health_consent_id, status);
ALTER TABLE comments ADD COLUMN community_health_consent_id BIGINT NULL,
    ADD COLUMN row_version BIGINT NOT NULL DEFAULT 0,
    ADD CONSTRAINT fk_comment_community_health_consent FOREIGN KEY (community_health_consent_id) REFERENCES community_health_consents(id),
    ADD INDEX idx_comment_community_health_consent (user_id, community_health_consent_id, status);
CREATE TABLE community_deletion_requests (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    withdrawal_consent_id BIGINT NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL,
    post_count INT NOT NULL,
    comment_count INT NOT NULL,
    acknowledged_by BIGINT NULL,
    acknowledged_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_community_deletion_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_community_deletion_withdrawal FOREIGN KEY (withdrawal_consent_id) REFERENCES community_health_consents(id),
    CONSTRAINT fk_community_deletion_reviewer FOREIGN KEY (acknowledged_by) REFERENCES users(id),
    INDEX idx_community_deletion_status (status, created_at),
    INDEX idx_community_deletion_user (user_id, id)
);
CREATE TABLE community_deletion_request_items (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    target_id BIGINT NOT NULL,
    source_consent_id BIGINT NOT NULL,
    CONSTRAINT fk_community_deletion_item_request FOREIGN KEY (request_id) REFERENCES community_deletion_requests(id),
    CONSTRAINT fk_community_deletion_item_consent FOREIGN KEY (source_consent_id) REFERENCES community_health_consents(id),
    UNIQUE KEY uk_community_deletion_target (request_id, target_type, target_id)
);
