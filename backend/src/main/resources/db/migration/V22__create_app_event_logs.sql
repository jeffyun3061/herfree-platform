CREATE TABLE app_event_logs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_name      VARCHAR(80)  NOT NULL,
    source          VARCHAR(30)  NOT NULL,
    route           VARCHAR(180) NULL,
    user_id         BIGINT       NULL,
    session_hash    VARCHAR(80)  NULL,
    ip_hash         VARCHAR(80)  NULL,
    user_agent_hash VARCHAR(80)  NULL,
    occurred_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_app_event_logs_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE SET NULL
);

CREATE INDEX idx_app_event_logs_event_occurred
    ON app_event_logs (event_name, occurred_at);

CREATE INDEX idx_app_event_logs_occurred
    ON app_event_logs (occurred_at);

CREATE INDEX idx_app_event_logs_user_occurred
    ON app_event_logs (user_id, occurred_at);
