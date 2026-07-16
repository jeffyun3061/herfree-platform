package com.herfree.domain.user.repository;

import com.herfree.domain.user.entity.RoleAuditLog;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoleAuditLogRepository extends JpaRepository<RoleAuditLog, Long> {

    @Modifying
    @Query("DELETE FROM RoleAuditLog a WHERE a.createdAt < :cutoff")
    int deleteCreatedBefore(@Param("cutoff") Instant cutoff);
}
