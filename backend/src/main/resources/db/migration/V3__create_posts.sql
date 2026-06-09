-- =====================================================
-- V3: posts 테이블 생성
-- 게시글은 삭제 시 물리 삭제 대신 status를 DELETED로 전환한다(soft delete).
-- board_id와 user_id는 외래키로 참조 무결성을 보장한다.
-- =====================================================

CREATE TABLE posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    board_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    view_count INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    CONSTRAINT fk_post_board FOREIGN KEY (board_id) REFERENCES boards(id),
    CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES users(id),
    -- board_id + status + created_at 복합 인덱스: 게시판별 최신 글 목록 조회 성능을 높인다
    INDEX idx_post_board_status_created (board_id, status, created_at DESC),
    INDEX idx_post_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
