-- =====================================================
-- V4: comments 테이블 생성
-- parent_id는 대댓글 확장을 위해 설계한다. 1차 MVP에서 구현하지 않더라도
-- 스키마는 미리 포함하여 추후 마이그레이션 없이 기능을 추가할 수 있도록 한다.
-- =====================================================

CREATE TABLE comments
(
    id           BIGINT     NOT NULL AUTO_INCREMENT,
    post_id      BIGINT     NOT NULL,
    user_id      BIGINT     NOT NULL,
    -- NULL 허용 — 최상위 댓글은 parent_id가 없고, 대댓글만 값을 가진다
    parent_id    BIGINT     NULL,
    content      TEXT       NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
    created_at   DATETIME(6) NOT NULL,
    updated_at   DATETIME(6) NOT NULL,

    PRIMARY KEY (id),

    -- 특정 게시글의 댓글 목록 조회 시 사용
    INDEX idx_comments_post_id (post_id),

    CONSTRAINT fk_comments_post_id
        FOREIGN KEY (post_id) REFERENCES posts (id),

    CONSTRAINT fk_comments_user_id
        FOREIGN KEY (user_id) REFERENCES users (id),

    -- 대댓글 관계 — 부모 댓글이 삭제되면 대댓글도 같이 처리되어야 하나,
    -- soft delete 정책이므로 FK만 걸고 CASCADE는 지정하지 않는다
    CONSTRAINT fk_comments_parent_id
        FOREIGN KEY (parent_id) REFERENCES comments (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
