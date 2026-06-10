-- =====================================================
-- V5: reactions 테이블 생성
-- target_type + target_id 조합으로 게시글/댓글 모두를 대상으로 설계한다.
-- 다형 연관(polymorphic association)을 사용하면 테이블 수를 줄이고
-- 추후 확장(예: 콘텐츠 반응)을 FK 없이 지원할 수 있다.
-- =====================================================

CREATE TABLE reactions
(
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    user_id       BIGINT      NOT NULL,
    target_type   VARCHAR(20) NOT NULL,
    target_id     BIGINT      NOT NULL,
    reaction_type VARCHAR(20) NOT NULL,
    created_at    DATETIME(6) NOT NULL,

    PRIMARY KEY (id),

    -- 같은 사용자가 동일 대상에 동일 반응을 중복 등록하는 것을 DB 레벨에서 방지한다
    UNIQUE INDEX uk_reactions_user_target_type (user_id, target_type, target_id, reaction_type),

    -- 특정 대상의 반응 집계 시 사용
    INDEX idx_reactions_target (target_type, target_id),

    CONSTRAINT fk_reactions_user_id
        FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
