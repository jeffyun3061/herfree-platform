package com.herfree.global.util;

import com.herfree.domain.user.entity.UserRole;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

public final class StaffRolePolicy {

    private static final Set<UserRole> ASSIGNABLE_ROLES =
            EnumSet.of(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN);

    private StaffRolePolicy() {
    }

    public static List<String> resolveAuthorities(UserRole role) {
        if (role == null) {
            return List.of("ROLE_USER");
        }
        return switch (role) {
            case SUPER_ADMIN -> List.of(
                    "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR", "ROLE_USER");
            case ADMIN -> List.of("ROLE_ADMIN", "ROLE_MODERATOR", "ROLE_USER");
            case MODERATOR -> List.of("ROLE_MODERATOR", "ROLE_USER");
            default -> List.of("ROLE_USER");
        };
    }

    public static boolean isStaff(UserRole role) {
        return role == UserRole.MODERATOR || role == UserRole.ADMIN || role == UserRole.SUPER_ADMIN;
    }

    public static boolean canManageMemberStatus(UserRole role) {
        return role == UserRole.ADMIN || role == UserRole.SUPER_ADMIN;
    }

    public static boolean canChangeRole(UserRole actorRole) {
        return actorRole == UserRole.SUPER_ADMIN;
    }

    public static boolean isAssignableRole(UserRole role) {
        return ASSIGNABLE_ROLES.contains(role);
    }

    public static Set<UserRole> assignableRoles() {
        return ASSIGNABLE_ROLES;
    }
}
