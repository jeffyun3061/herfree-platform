CREATE TABLE reactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    target_id BIGINT NOT NULL,
    reaction_type VARCHAR(20) NOT NULL,
    created_at DATETIME(6),
    CONSTRAINT fk_reaction_user FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_reaction (user_id, target_type, target_id, reaction_type),
    INDEX idx_reaction_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
