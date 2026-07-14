CREATE TABLE nickname_change_history (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    actor_user_id BIGINT NULL,
    old_nickname VARCHAR(50) NOT NULL,
    new_nickname VARCHAR(50) NOT NULL,
    change_type VARCHAR(20) NOT NULL,
    reason VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_nickname_change_history_user_created (user_id, created_at),
    INDEX idx_nickname_change_history_actor_created (actor_user_id, created_at),
    CONSTRAINT fk_nickname_change_history_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_nickname_change_history_actor
        FOREIGN KEY (actor_user_id) REFERENCES users(id)
);
