CREATE TABLE post_bookmarks (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_post_bookmarks_user_post UNIQUE (user_id, post_id),
    CONSTRAINT fk_post_bookmarks_user
        FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_post_bookmarks_post
        FOREIGN KEY (post_id) REFERENCES posts (id),
    INDEX idx_post_bookmarks_user_created (user_id, created_at),
    INDEX idx_post_bookmarks_post_id (post_id)
);
