-- =====================================================
-- V27: 기존 DATETIME 값은 Asia/Seoul 벽시계 기준이었음.
-- UTC Instant 저장에 맞추기 위해 9시간을 빼서 UTC로 변환한다.
-- journal_records.record_date는 KST 달력 날짜이므로 변경하지 않는다.
-- =====================================================

UPDATE users
SET created_at = created_at - INTERVAL 9 HOUR,
    updated_at = updated_at - INTERVAL 9 HOUR;

UPDATE users
SET suspended_until = suspended_until - INTERVAL 9 HOUR
WHERE suspended_until IS NOT NULL;

UPDATE user_profiles
SET created_at = created_at - INTERVAL 9 HOUR,
    updated_at = updated_at - INTERVAL 9 HOUR;

UPDATE boards
SET created_at = created_at - INTERVAL 9 HOUR,
    updated_at = updated_at - INTERVAL 9 HOUR;

UPDATE posts
SET created_at = created_at - INTERVAL 9 HOUR,
    updated_at = updated_at - INTERVAL 9 HOUR;

UPDATE comments
SET created_at = created_at - INTERVAL 9 HOUR,
    updated_at = updated_at - INTERVAL 9 HOUR;

UPDATE reactions
SET created_at = created_at - INTERVAL 9 HOUR;

UPDATE reports
SET created_at = created_at - INTERVAL 9 HOUR;

UPDATE reports
SET processed_at = processed_at - INTERVAL 9 HOUR
WHERE processed_at IS NOT NULL;

UPDATE contents
SET created_at = created_at - INTERVAL 9 HOUR,
    updated_at = updated_at - INTERVAL 9 HOUR;

UPDATE videos
SET created_at = created_at - INTERVAL 9 HOUR,
    updated_at = updated_at - INTERVAL 9 HOUR;

UPDATE products
SET created_at = created_at - INTERVAL 9 HOUR,
    updated_at = updated_at - INTERVAL 9 HOUR;

UPDATE journal_records
SET created_at = created_at - INTERVAL 9 HOUR,
    updated_at = updated_at - INTERVAL 9 HOUR;

UPDATE role_audit_logs
SET created_at = created_at - INTERVAL 9 HOUR;

UPDATE role_audit_logs
SET suspended_until = suspended_until - INTERVAL 9 HOUR
WHERE suspended_until IS NOT NULL;

UPDATE post_images
SET created_at = created_at - INTERVAL 9 HOUR,
    updated_at = updated_at - INTERVAL 9 HOUR;

UPDATE password_reset_tokens
SET created_at = created_at - INTERVAL 9 HOUR,
    updated_at = updated_at - INTERVAL 9 HOUR,
    expires_at = expires_at - INTERVAL 9 HOUR;

UPDATE password_reset_tokens
SET used_at = used_at - INTERVAL 9 HOUR
WHERE used_at IS NOT NULL;

UPDATE app_event_logs
SET occurred_at = occurred_at - INTERVAL 9 HOUR,
    created_at  = created_at - INTERVAL 9 HOUR;
