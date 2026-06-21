-- =====================================================
-- V13: 큐레이션 컬럼 (정렬, 고정, 추천)
-- videos: sort_order, is_featured
-- contents: sort_order, is_pinned
-- posts (공지): sort_order, is_pinned
-- =====================================================

ALTER TABLE videos
    ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER is_visible,
    ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER sort_order;

ALTER TABLE contents
    ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER status,
    ADD COLUMN is_pinned TINYINT(1) NOT NULL DEFAULT 0 AFTER sort_order;

ALTER TABLE posts
    ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER is_anonymous,
    ADD COLUMN is_pinned TINYINT(1) NOT NULL DEFAULT 0 AFTER sort_order;

CREATE INDEX idx_videos_curation ON videos (is_visible, is_featured, sort_order DESC);
CREATE INDEX idx_contents_curation ON contents (status, category, is_pinned, sort_order DESC);
CREATE INDEX idx_posts_notice_curation ON posts (board_id, status, is_pinned, sort_order DESC);

UPDATE contents SET sort_order = id WHERE sort_order = 0;
UPDATE videos SET sort_order = id WHERE sort_order = 0;
UPDATE posts SET sort_order = id WHERE sort_order = 0;
