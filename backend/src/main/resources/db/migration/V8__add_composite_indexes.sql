-- =====================================================
-- V8: 쿼리 패턴에 맞는 복합 인덱스 추가
-- 실제 사용되는 WHERE + ORDER BY 절을 분석해 커버링 인덱스를 보강한다.
--
-- 기존 단일 인덱스를 DROP하는 이유:
-- 복합 인덱스가 단일 인덱스를 완전히 대체하므로 중복 인덱스를 제거해
-- INSERT/UPDATE 시 인덱스 유지 비용을 낮춘다.
-- =====================================================

-- ─────────────────────────────────────────────────
-- posts: 내 게시글 목록 조회 최적화
-- 기존 idx_posts_user_id(user_id)는 status·created_at 필터가 없어
-- findByUserIdAndStatusOrderByCreatedAtDesc 실행 시 user_id 행을 읽은 뒤
-- status 필터링을 위해 테이블 풀 스캔에 가까운 추가 조회가 발생한다.
-- (user_id, status, created_at) 복합 인덱스로 커버링 인덱스 효과를 낸다.
-- ─────────────────────────────────────────────────
ALTER TABLE posts
    DROP INDEX idx_posts_user_id,
    ADD INDEX idx_posts_user_status_created (user_id, status, created_at DESC);

-- ─────────────────────────────────────────────────
-- comments: 게시글 댓글 목록 조회 최적화
-- 기존 idx_comments_post_id(post_id)만으로는
-- findByPostIdAndStatusOrderByCreatedAtAsc 수행 시
-- post_id 일치 행을 읽어들인 뒤 status 필터를 메모리에서 처리해야 한다.
-- 복합 인덱스로 status와 created_at까지 인덱스 레벨에서 처리한다.
-- ─────────────────────────────────────────────────
ALTER TABLE comments
    DROP INDEX idx_comments_post_id,
    ADD INDEX idx_comments_post_status_created (post_id, status, created_at ASC);

-- ─────────────────────────────────────────────────
-- reports: 관리자 신고 목록 조회 최적화
-- findByStatusOrderByCreatedAtDesc는 status 필터 + created_at 정렬을 함께 사용한다.
-- status 단일 인덱스는 정렬에 filesort가 발생할 수 있어 복합 인덱스로 교체한다.
-- ─────────────────────────────────────────────────
ALTER TABLE reports
    DROP INDEX idx_reports_status,
    ADD INDEX idx_reports_status_created (status, created_at DESC);

-- ─────────────────────────────────────────────────
-- contents: 카테고리 필터 + 상태 + 정렬 최적화
-- findByCategoryAndStatusOrderByCreatedAtDesc는
-- category + status + created_at을 모두 사용하므로 복합 인덱스가 필요하다.
-- findByStatusOrderByCreatedAtDesc(전체 조회)는 (status, created_at) 인덱스를 활용한다.
-- ─────────────────────────────────────────────────
ALTER TABLE contents
    DROP INDEX idx_contents_category,
    ADD INDEX idx_contents_category_status_created (category, status, created_at DESC),
    ADD INDEX idx_contents_status_created (status, created_at DESC);
