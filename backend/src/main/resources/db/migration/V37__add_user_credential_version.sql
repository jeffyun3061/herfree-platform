-- 비밀번호 변경·재설정 시 기존 JWT를 즉시 무효화하기 위한 인증 버전
ALTER TABLE users
    ADD COLUMN credential_version INT NOT NULL DEFAULT 0 AFTER password;
