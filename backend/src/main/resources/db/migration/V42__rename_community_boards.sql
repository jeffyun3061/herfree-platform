-- 공개 커뮤니티의 운영 명칭을 사용자에게 안내하는 이름과 일치시킨다.
UPDATE boards SET name = '공지', updated_at = NOW(6) WHERE board_type = 'NOTICE';
UPDATE boards SET name = '자유게시판', updated_at = NOW(6) WHERE board_type = 'FREE';
UPDATE boards SET name = '정보공유', updated_at = NOW(6) WHERE board_type = 'EXPERIENCE';
UPDATE boards SET name = '연애고지', updated_at = NOW(6) WHERE board_type = 'RELATIONSHIP';
UPDATE boards SET name = '검사대기', updated_at = NOW(6) WHERE board_type = 'PHOBIA';
