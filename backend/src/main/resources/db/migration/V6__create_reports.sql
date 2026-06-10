-- =====================================================
-- V6: reports 테이블 생성
-- 신고 대상을 POST, COMMENT, USER로 확장 가능하게 target_type으로 관리한다.
-- processed_by는 처리한 관리자 ID로, NULL이면 아직 처리되지 않은 신고다.
-- =====================================================

CREATE TABLE reports
(
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    reporter_id  BIGINT       NOT NULL,
    target_type  VARCHAR(20)  NOT NULL,
    target_id    BIGINT       NOT NULL,
    reason       VARCHAR(100) NOT NULL,
    detail       TEXT         NULL,
    -- PENDING: 처리 대기, ACCEPTED: 신고 인정, REJECTED: 신고 기각
    status       VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    -- NULL이면 미처리 상태, 처리되면 관리자 ID가 들어간다
    processed_by BIGINT       NULL,
    processed_at DATETIME     NULL,
    created_at   DATETIME(6)  NOT NULL,

    PRIMARY KEY (id),

    -- 동일 사용자가 동일 대상을 중복 신고하는 것을 DB 레벨에서 방지한다
    UNIQUE INDEX uk_reports_reporter_target (reporter_id, target_type, target_id),

    -- 관리자가 상태별로 신고 목록을 조회할 때 사용
    INDEX idx_reports_status (status),

    CONSTRAINT fk_reports_reporter_id
        FOREIGN KEY (reporter_id) REFERENCES users (id),

    CONSTRAINT fk_reports_processed_by
        FOREIGN KEY (processed_by) REFERENCES users (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
