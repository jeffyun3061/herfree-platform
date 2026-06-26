-- 주간 댓글순 정렬용 인덱스는 V8 `idx_comments_post_status_created` 가 이미 커버한다.
-- 동일 이름으로 CREATE INDEX 를 다시 실행하면 로컬에서 마이그레이션이 실패하므로 no-op.
SELECT 1;
