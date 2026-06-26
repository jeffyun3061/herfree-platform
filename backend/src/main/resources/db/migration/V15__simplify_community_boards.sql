-- 커뮤니티 탭 단순화: 공지·자유·질문·비밀사연만 노출
UPDATE boards
SET is_active = 0, updated_at = NOW(6)
WHERE board_type IN (
    'PHOBIA', 'SYMPTOM', 'EXPERIENCE', 'RELATIONSHIP', 'SUPPORT', 'EXPERT', 'PRODUCT_REVIEW'
);

UPDATE boards SET sort_order = 1, updated_at = NOW(6) WHERE board_type = 'NOTICE';
UPDATE boards SET sort_order = 2, updated_at = NOW(6) WHERE board_type = 'FREE';

INSERT INTO boards (name, description, board_type, sort_order, is_active, created_at, updated_at)
SELECT '질문하기', '궁금한 점을 물어보고 서로 답해 주세요.', 'QUESTION', 3, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM boards WHERE board_type = 'QUESTION');

INSERT INTO boards (name, description, board_type, sort_order, is_active, created_at, updated_at)
SELECT '비밀사연',
       '헤르프리에게 사연을 제보해 주세요. 운영자만 전체 내용을 확인하며, 다른 회원에게는 제목만 마스킹되어 보입니다.',
       'SECRET_STORY', 4, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM boards WHERE board_type = 'SECRET_STORY');
