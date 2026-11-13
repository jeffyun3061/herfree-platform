package com.herfree.domain.user.repository;

import com.herfree.domain.user.entity.RoleAuditLog;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoleAuditLogRepository extends JpaRepository<RoleAuditLog, Long> {

    @Query("""
            SELECT a FROM RoleAuditLog a WHERE a.createdAt >= :since
              AND (:target IS NULL OR a.targetUserId = :target)
            ORDER BY a.createdAt DESC, a.id DESC
            """)
    org.springframework.data.domain.Slice<RoleAuditLog> findChanges(
            @Param("since") Instant since, @Param("target") Long target,
            org.springframework.data.domain.Pageable pageable);

    @Modifying
    @Query("DELETE FROM RoleAuditLog a WHERE a.createdAt < :cutoff")
    int deleteCreatedBefore(@Param("cutoff") Instant cutoff);
}
