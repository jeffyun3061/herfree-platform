-- V29: 게시글 작성 시점 IP 마스킹 값 저장 (커뮤니티 표시용)

ALTER TABLE posts
    ADD COLUMN author_ip_masked VARCHAR(24) NULL AFTER is_anonymous;
