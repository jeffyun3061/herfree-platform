-- 신고 승인·반려 근거를 보존한다. 기존 처리 데이터는 NULL을 허용해 안전하게 유지한다.
ALTER TABLE reports
    ADD COLUMN process_note VARCHAR(500) NULL AFTER processed_at;
