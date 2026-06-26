-- 커뮤니티 탭 순서 조정 + 전문가 정보방 비활성 (정보 메뉴로 대체)
-- 공지(0) → 자유(1) → 질문하기(2) → 포비아(3) → …
UPDATE boards SET sort_order = 0, updated_at = NOW(6) WHERE board_type = 'NOTICE';
UPDATE boards SET sort_order = 1, updated_at = NOW(6) WHERE board_type = 'FREE';
UPDATE boards SET sort_order = 2, updated_at = NOW(6) WHERE board_type = 'QUESTION';
UPDATE boards SET sort_order = 3, updated_at = NOW(6) WHERE board_type = 'PHOBIA';
UPDATE boards SET sort_order = 4, updated_at = NOW(6) WHERE board_type = 'SYMPTOM';
UPDATE boards SET sort_order = 5, updated_at = NOW(6) WHERE board_type = 'RELATIONSHIP';
UPDATE boards SET sort_order = 6, updated_at = NOW(6) WHERE board_type = 'EXPERIENCE';
UPDATE boards SET sort_order = 7, updated_at = NOW(6) WHERE board_type = 'SUPPORT';
UPDATE boards SET sort_order = 8, updated_at = NOW(6) WHERE board_type = 'PRODUCT_REVIEW';
UPDATE boards SET sort_order = 9, updated_at = NOW(6) WHERE board_type = 'SECRET_STORY';

UPDATE boards SET is_active = 0, updated_at = NOW(6) WHERE board_type = 'EXPERT';
