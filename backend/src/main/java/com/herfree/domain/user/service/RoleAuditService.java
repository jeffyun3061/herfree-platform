package com.herfree.domain.user.service;

import com.herfree.domain.user.entity.RoleAuditAction;
import com.herfree.domain.user.entity.RoleAuditLog;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.repository.RoleAuditLogRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회원 역할·상태 변경 감사 — 누가·언제·무엇을 바꿨는지 {@code role_audit_logs}에 기록.
 */
@Service
@RequiredArgsConstructor
public class RoleAuditService {

    private final RoleAuditLogRepository roleAuditLogRepository;

    @Transactional
    public void logRoleChange(
            Long actorId,
            Long targetUserId,
            UserRole previousRole,
            UserRole newRole
    ) {
        roleAuditLogRepository.save(RoleAuditLog.builder()
                .actorId(actorId)
                .targetUserId(targetUserId)
                .action(RoleAuditAction.ROLE_CHANGE)
                .previousRole(previousRole)
                .newRole(newRole)
                .build());
    }

    @Transactional
    public void logStatusChange(
            Long actorId,
            Long targetUserId,
            UserStatus previousStatus,
            UserStatus newStatus
    ) {
        logStatusChange(actorId, targetUserId, previousStatus, newStatus, null, null, null);
    }

    @Transactional
    public void logStatusChange(
            Long actorId,
            Long targetUserId,
            UserStatus previousStatus,
            UserStatus newStatus,
            String reason,
            String note,
            Instant suspendedUntil
    ) {
        roleAuditLogRepository.save(RoleAuditLog.builder()
                .actorId(actorId)
                .targetUserId(targetUserId)
                .action(RoleAuditAction.STATUS_CHANGE)
                .previousStatus(previousStatus)
                .newStatus(newStatus)
                .reason(reason)
                .note(note)
                .suspendedUntil(suspendedUntil)
                .build());
    }

    @Transactional
    public void logNicknameReset(Long actorId, Long targetUserId, String reason, String note) {
        roleAuditLogRepository.save(RoleAuditLog.builder()
                .actorId(actorId)
                .targetUserId(targetUserId)
                .action(RoleAuditAction.NICKNAME_RESET)
                .reason(reason)
                .note(note)
                .build());
    }
}
