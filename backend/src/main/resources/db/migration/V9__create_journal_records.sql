CREATE TABLE journal_records (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT       NOT NULL,
    record_date     DATE         NOT NULL,
    medication_status VARCHAR(20),
    avg_sleep       VARCHAR(20),
    stress_level    VARCHAR(20),
    had_symptoms    BOOLEAN      NOT NULL DEFAULT FALSE,
    prodromal_symptoms JSON,
    severity        TINYINT,
    triggers        JSON,
    memo            TEXT,
    mood            VARCHAR(20),
    sleep_hours     DECIMAL(3, 1),
    supplement_taken BOOLEAN     NOT NULL DEFAULT FALSE,
    exercise_done   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_journal_user_date UNIQUE (user_id, record_date),
    CONSTRAINT fk_journal_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_journal_user_date ON journal_records (user_id, record_date DESC);
CREATE INDEX idx_journal_symptoms ON journal_records (had_symptoms, record_date);
