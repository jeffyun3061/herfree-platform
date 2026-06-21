-- 운영 문의·1:1 비밀 상담 게시판 (작성자·운영자만 열람, 일반 커뮤니티 탭에서 제외)
INSERT INTO boards (name, description, board_type, sort_order, is_active, created_at, updated_at)
VALUES ('운영 문의', '서비스 문의·건의·신고 등 운영팀에 전달하는 비공개 게시판입니다.', 'INQUIRY', 90, 1, NOW(6), NOW(6)),
       ('1:1 비밀 상담', '관리자와 1:1로 나누는 비공개 상담 공간입니다.', 'PRIVATE_CONSULT', 91, 1, NOW(6), NOW(6));
