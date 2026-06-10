-- =====================================================
-- V3: posts 테이블 생성
-- 게시글은 board와 user에 종속된다 (erd.md 6.4 참고).
-- soft delete 정책에 따라 status 컬럼으로 삭제/숨김을 표현한다.
-- 익명 작성 정책: is_anonymous=true이면 API 응답에서 닉네임을 마스킹한다.
-- =====================================================

CREATE TABLE posts
(
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    board_id    BIGINT       NOT NULL,
    user_id     BIGINT       NOT NULL,
    title       VARCHAR(200) NOT NULL,
    content     TEXT         NOT NULL,
    view_count  INT          NOT NULL DEFAULT 0,
    -- ACTIVE/HIDDEN/DELETED 세 상태로 soft delete를 구현한다
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    -- PUBLIC/MEMBERS_ONLY — 추후 PRIVATE 확장을 고려해 VARCHAR로 설계
    visibility  VARCHAR(20)  NOT NULL DEFAULT 'PUBLIC',
    is_anonymous TINYINT(1)  NOT NULL DEFAULT 0,
    created_at  DATETIME(6)  NOT NULL,
    updated_at  DATETIME(6)  NOT NULL,

    PRIMARY KEY (id),

    -- 특정 게시판의 활성 게시글을 최신순으로 조회할 때 사용하는 복합 인덱스
    -- board_id + status + created_at 순서로 구성해 커버링 인덱스 효과를 극대화한다
    INDEX idx_posts_board_status_created (board_id, status, created_at DESC),

    -- 내 게시글 목록 조회에 사용
    INDEX idx_posts_user_id (user_id),

    CONSTRAINT fk_posts_board_id
        FOREIGN KEY (board_id) REFERENCES boards (id),

    CONSTRAINT fk_posts_user_id
        FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
