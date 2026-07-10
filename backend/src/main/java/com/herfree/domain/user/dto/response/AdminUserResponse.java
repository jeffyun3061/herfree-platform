package com.herfree.domain.user.dto.response;

import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import java.time.Instant;

public record AdminUserResponse(
        Long id,
        String email,
        String nickname,
        UserRole role,
        UserStatus status,
        Instant suspendedUntil,
        String suspensionReason,
        Instant createdAt
) {
    public static AdminUserResponse of(User user, UserProfile profile) {
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                profile.getNickname(),
                user.getRole(),
                user.getStatus(),
                user.getSuspendedUntil(),
                user.getSuspensionReason(),
                user.getCreatedAt()
        );
    }
}
