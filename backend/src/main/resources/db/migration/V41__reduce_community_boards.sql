-- 공개 커뮤니티는 공지·자유게시판·정보공유·연애고지·검사대기만 운영한다.
-- 운영 문의(INQUIRY), 1:1 비밀 상담(PRIVATE_CONSULT)은 서비스 기능이므로 보존한다.
-- EXPERT는 이미 비활성 상태인 정보 메뉴 대체 게시판이므로 보존하되 노출하지 않는다.

-- 제거 대상 게시판의 글에 연결된 부가 데이터부터 삭제한다.
DELETE FROM post_bookmarks
WHERE post_id IN (
    SELECT id FROM posts
    WHERE board_id IN (
        SELECT id FROM boards
        WHERE board_type IN ('QUESTION', 'SYMPTOM', 'SUPPORT', 'PRODUCT_REVIEW', 'SECRET_STORY')
    )
);

DELETE FROM post_images
WHERE post_id IN (
    SELECT id FROM posts
    WHERE board_id IN (
        SELECT id FROM boards
        WHERE board_type IN ('QUESTION', 'SYMPTOM', 'SUPPORT', 'PRODUCT_REVIEW', 'SECRET_STORY')
    )
);

DELETE FROM reactions
WHERE (target_type = 'POST' AND target_id IN (
           SELECT id FROM posts
           WHERE board_id IN (
               SELECT id FROM boards
               WHERE board_type IN ('QUESTION', 'SYMPTOM', 'SUPPORT', 'PRODUCT_REVIEW', 'SECRET_STORY')
           )
       ))
   OR (target_type = 'COMMENT' AND target_id IN (
           SELECT c.id
           FROM comments c
           JOIN posts p ON p.id = c.post_id
           JOIN boards b ON b.id = p.board_id
           WHERE b.board_type IN ('QUESTION', 'SYMPTOM', 'SUPPORT', 'PRODUCT_REVIEW', 'SECRET_STORY')
       ));

DELETE FROM reports
WHERE (target_type = 'POST' AND target_id IN (
           SELECT id FROM posts
           WHERE board_id IN (
               SELECT id FROM boards
               WHERE board_type IN ('QUESTION', 'SYMPTOM', 'SUPPORT', 'PRODUCT_REVIEW', 'SECRET_STORY')
           )
       ))
   OR (target_type = 'COMMENT' AND target_id IN (
           SELECT c.id
           FROM comments c
           JOIN posts p ON p.id = c.post_id
           JOIN boards b ON b.id = p.board_id
           WHERE b.board_type IN ('QUESTION', 'SYMPTOM', 'SUPPORT', 'PRODUCT_REVIEW', 'SECRET_STORY')
       ));

-- 대댓글의 자기참조 FK 때문에 먼저 부모 연결을 끊은 뒤 댓글을 삭제한다.
UPDATE comments c
JOIN posts p ON p.id = c.post_id
JOIN boards b ON b.id = p.board_id
SET c.parent_id = NULL
WHERE b.board_type IN ('QUESTION', 'SYMPTOM', 'SUPPORT', 'PRODUCT_REVIEW', 'SECRET_STORY');

DELETE FROM comments
WHERE post_id IN (
    SELECT id FROM posts
    WHERE board_id IN (
        SELECT id FROM boards
        WHERE board_type IN ('QUESTION', 'SYMPTOM', 'SUPPORT', 'PRODUCT_REVIEW', 'SECRET_STORY')
    )
);

-- 혹시 영상이 제거 대상 게시판을 참조하고 있으면 영상은 보존하고 연결만 해제한다.
UPDATE videos
SET related_board_id = NULL
WHERE related_board_id IN (
    SELECT id FROM boards
    WHERE board_type IN ('QUESTION', 'SYMPTOM', 'SUPPORT', 'PRODUCT_REVIEW', 'SECRET_STORY')
);

DELETE FROM posts
WHERE board_id IN (
    SELECT id FROM boards
    WHERE board_type IN ('QUESTION', 'SYMPTOM', 'SUPPORT', 'PRODUCT_REVIEW', 'SECRET_STORY')
);

DELETE FROM boards
WHERE board_type IN ('QUESTION', 'SYMPTOM', 'SUPPORT', 'PRODUCT_REVIEW', 'SECRET_STORY');

-- 화면 표시명과 정렬 순서를 DB에서도 동일하게 맞춘다.
UPDATE boards
SET name = '자유게시판', sort_order = 1, is_active = 1, updated_at = NOW(6)
WHERE board_type = 'FREE';

UPDATE boards SET sort_order = 0, is_active = 1, updated_at = NOW(6) WHERE board_type = 'NOTICE';
UPDATE boards SET sort_order = 2, is_active = 1, updated_at = NOW(6) WHERE board_type = 'EXPERIENCE';
UPDATE boards SET sort_order = 3, is_active = 1, updated_at = NOW(6) WHERE board_type = 'RELATIONSHIP';
UPDATE boards SET sort_order = 4, is_active = 1, updated_at = NOW(6) WHERE board_type = 'PHOBIA';
