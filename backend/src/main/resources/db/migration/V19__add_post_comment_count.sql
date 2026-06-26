-- 게시글 목록 댓글순 정렬용 비정규화 카운트 (ACTIVE 댓글만 집계)
ALTER TABLE posts
    ADD COLUMN comment_count INT NOT NULL DEFAULT 0 AFTER view_count;

UPDATE posts p
SET comment_count = (
    SELECT COUNT(*)
    FROM comments c
    WHERE c.post_id = p.id
      AND c.status = 'ACTIVE'
);

CREATE INDEX idx_posts_status_comment_count ON posts (status, comment_count DESC);
