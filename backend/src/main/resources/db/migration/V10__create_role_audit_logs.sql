-- 권한·계정 상태 변경 감사 로그
CREATE TABLE role_audit_logs (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    actor_id        BIGINT       NOT NULL,
    target_user_id  BIGINT       NOT NULL,
    action          VARCHAR(50)  NOT NULL,
    previous_role   VARCHAR(50)  NULL,
    new_role        VARCHAR(50)  NULL,
    previous_status VARCHAR(50)  NULL,
    new_status      VARCHAR(50)  NULL,
    created_at      DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_role_audit_target (target_user_id, created_at),
    INDEX idx_role_audit_actor (actor_id, created_at),
    CONSTRAINT fk_role_audit_actor FOREIGN KEY (actor_id) REFERENCES users (id),
    CONSTRAINT fk_role_audit_target FOREIGN KEY (target_user_id) REFERENCES users (id)
);
