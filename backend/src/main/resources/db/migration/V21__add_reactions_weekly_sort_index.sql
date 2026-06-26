-- 주간 인기순 반응 집계용 (이미 있으면 스킵)
SET @idx_exists := (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'reactions'
      AND index_name = 'idx_reactions_target_created'
);
SET @ddl := IF(
    @idx_exists = 0,
    'CREATE INDEX idx_reactions_target_created ON reactions (target_type, target_id, created_at DESC)',
    'SELECT 1'
);
PREPARE flyway_stmt FROM @ddl;
EXECUTE flyway_stmt;
DEALLOCATE PREPARE flyway_stmt;
