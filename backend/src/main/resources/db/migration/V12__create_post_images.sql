-- =====================================================
-- V12: 게시글 첨부 이미지 테이블
-- 1차는 게시글당 1장이지만 sort_order로 다중 이미지 확장을 열어 둔다.
-- =====================================================

CREATE TABLE post_images
(
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    post_id    BIGINT       NOT NULL,
    image_url  VARCHAR(500) NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0,
    created_at DATETIME(6)  NOT NULL,
    updated_at DATETIME(6)  NOT NULL,

    PRIMARY KEY (id),

    INDEX idx_post_images_post_id (post_id),

    CONSTRAINT fk_post_images_post_id
        FOREIGN KEY (post_id) REFERENCES posts (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
