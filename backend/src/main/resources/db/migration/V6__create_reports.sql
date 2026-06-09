CREATE TABLE reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reporter_id BIGINT NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    target_id BIGINT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    detail TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    processed_by BIGINT NULL,
    processed_at DATETIME NULL,
    created_at DATETIME(6),
    CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES users(id),
    CONSTRAINT fk_report_processor FOREIGN KEY (processed_by) REFERENCES users(id),
    UNIQUE KEY uk_report (reporter_id, target_type, target_id),
    INDEX idx_report_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
