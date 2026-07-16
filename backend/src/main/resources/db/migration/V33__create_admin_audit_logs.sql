CREATE TABLE admin_audit_logs
(
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_user_id   BIGINT       NOT NULL,
    http_method     VARCHAR(10)  NOT NULL,
    request_path    VARCHAR(255) NOT NULL,
    response_status INT          NOT NULL,
    request_id      VARCHAR(64)  NOT NULL,
    created_at      DATETIME(6)  NOT NULL,
    INDEX idx_admin_audit_actor_created (actor_user_id, created_at),
    INDEX idx_admin_audit_request_id (request_id)
);
