package com.herfree.domain.audit.repository;

import com.herfree.domain.audit.entity.AdminAuditLog;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {

    @Query("""
            SELECT a FROM AdminAuditLog a WHERE a.createdAt >= :since
              AND a.httpMethod IN ('POST', 'PUT', 'PATCH', 'DELETE')
              AND (:actor IS NULL OR a.actorUserId = :actor)
            ORDER BY a.createdAt DESC, a.id DESC
            """)
    org.springframework.data.domain.Slice<AdminAuditLog> findActions(
            @Param("since") Instant since, @Param("actor") Long actor,
            org.springframework.data.domain.Pageable pageable);

    @Modifying
    @Query("DELETE FROM AdminAuditLog a WHERE a.createdAt < :cutoff")
    int deleteCreatedBefore(@Param("cutoff") Instant cutoff);
}
