-- Add a new public board; existing private inquiries/stories remain private.
INSERT INTO boards (name, description, board_type, sort_order, is_active, created_at, updated_at)
SELECT '익명 고민·질문', '닉네임을 숨기고 고민을 나누는 공개 공간입니다. 글과 댓글은 비회원도 읽을 수 있습니다.',
       'ANONYMOUS_QUESTION', 15, true, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM boards WHERE board_type = 'ANONYMOUS_QUESTION');
