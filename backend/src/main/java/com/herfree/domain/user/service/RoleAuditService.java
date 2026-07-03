package com.herfree.domain.user.service;

import com.herfree.domain.user.entity.RoleAuditAction;
import com.herfree.domain.user.entity.RoleAuditLog;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.repository.RoleAuditLogRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
            LocalDateTime suspendedUntil
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
