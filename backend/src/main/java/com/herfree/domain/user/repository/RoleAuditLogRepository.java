package com.herfree.domain.user.repository;

import com.herfree.domain.user.entity.RoleAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleAuditLogRepository extends JpaRepository<RoleAuditLog, Long> {
}
