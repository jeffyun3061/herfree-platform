-- =====================================================
-- V7: contents, videos, products 테이블 생성
-- 세 테이블은 성격이 달라 분리 마이그레이션보다 하나의 V7으로 묶어 관리한다.
-- =====================================================

-- 정보 콘텐츠 테이블
-- 운영자·전문가가 작성하는 정보성 글로, 게시판 게시글과 별도로 관리한다.
-- 큐레이션된 정보를 제공하는 공간이므로 author_id는 반드시 필요하다.
CREATE TABLE contents
(
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    author_id    BIGINT       NOT NULL,
    title        VARCHAR(255) NOT NULL,
    content      TEXT         NOT NULL,
    category     VARCHAR(50)  NOT NULL,
    content_type VARCHAR(20)  NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at   DATETIME(6)  NOT NULL,
    updated_at   DATETIME(6)  NOT NULL,

    PRIMARY KEY (id),

    -- 카테고리 필터 조회에 사용
    INDEX idx_contents_category (category),

    CONSTRAINT fk_contents_author_id
        FOREIGN KEY (author_id) REFERENCES users (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- 유튜브 영상 테이블
-- 영상은 직접 업로드하지 않고 유튜브 URL 기반으로 관리한다.
-- youtube_video_id를 별도로 저장하는 이유: 썸네일·플레이어 임베드에 videoId가 필요하기 때문이다.
CREATE TABLE videos
(
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    title             VARCHAR(255) NOT NULL,
    youtube_url       VARCHAR(500) NOT NULL,
    youtube_video_id  VARCHAR(20)  NOT NULL,
    thumbnail_url     VARCHAR(500) NULL,
    description       TEXT         NULL,
    -- 관련 게시판과 연결하면 게시판 페이지에서 관련 영상을 노출할 수 있다
    related_board_id  BIGINT       NULL,
    is_visible        TINYINT(1)   NOT NULL DEFAULT 1,
    created_at        DATETIME(6)  NOT NULL,
    updated_at        DATETIME(6)  NOT NULL,

    PRIMARY KEY (id),

    INDEX idx_videos_is_visible (is_visible),

    CONSTRAINT fk_videos_related_board_id
        FOREIGN KEY (related_board_id) REFERENCES boards (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- 제품 큐레이션 테이블
-- 1차에서는 외부 구매 링크 기반으로 관리한다.
-- click_count를 저장하는 이유: 어떤 제품에 관심이 많은지 운영 지표로 활용하기 위함이다.
CREATE TABLE products
(
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    name         VARCHAR(255) NOT NULL,
    category     VARCHAR(50)  NOT NULL,
    image_url    VARCHAR(500) NULL,
    description  TEXT         NULL,
    price        INT          NULL,
    external_url VARCHAR(500) NULL,
    click_count  INT          NOT NULL DEFAULT 0,
    is_visible   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at   DATETIME(6)  NOT NULL,
    updated_at   DATETIME(6)  NOT NULL,

    PRIMARY KEY (id),

    INDEX idx_products_is_visible (is_visible)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
