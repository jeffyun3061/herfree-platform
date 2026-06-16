package com.herfree.domain.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "role_audit_logs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RoleAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id", nullable = false)
    private Long actorId;

    @Column(name = "target_user_id", nullable = false)
    private Long targetUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private RoleAuditAction action;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_role", length = 50)
    private UserRole previousRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_role", length = 50)
    private UserRole newRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 50)
    private UserStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", length = 50)
    private UserStatus newStatus;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Builder
    private RoleAuditLog(
            Long actorId,
            Long targetUserId,
            RoleAuditAction action,
            UserRole previousRole,
            UserRole newRole,
            UserStatus previousStatus,
            UserStatus newStatus,
            LocalDateTime createdAt
    ) {
        this.actorId = actorId;
        this.targetUserId = targetUserId;
        this.action = action;
        this.previousRole = previousRole;
        this.newRole = newRole;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }
}
