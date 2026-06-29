package com.herfree.domain.user.service;

import com.herfree.domain.user.dto.request.UpdateUserRoleRequest;
import com.herfree.domain.user.dto.request.UpdateUserStatusRequest;
import com.herfree.domain.user.dto.response.AdminUserResponse;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.RoleChangeNotAllowedException;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.util.StaffRolePolicy;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final RoleAuditService roleAuditService;

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getUsers(String keyword, Pageable pageable) {
        String trimmedKeyword = keyword == null ? "" : keyword.trim();
        Page<User> users = trimmedKeyword.isBlank()
                ? userRepository.findByStatusNotOrderByCreatedAtDesc(UserStatus.DELETED, pageable)
                : userRepository.searchAdminUsers(parseUserId(trimmedKeyword), trimmedKeyword, UserStatus.DELETED, pageable);
        Map<Long, UserProfile> profiles = loadProfiles(users.getContent());
        return users.map(user -> AdminUserResponse.of(user, profiles.get(user.getId())));
    }

    @Transactional
    public AdminUserResponse updateRole(Long actorId, Long targetUserId, UpdateUserRoleRequest request) {
        User actor = findActiveUser(actorId);
        assertCanChangeRole(actor);

        if (actorId.equals(targetUserId)) {
            throw new RoleChangeNotAllowedException();
        }

        User target = findActiveUser(targetUserId);
        if (target.getRole() == UserRole.SUPER_ADMIN) {
            throw new RoleChangeNotAllowedException();
        }
        if (!StaffRolePolicy.isAssignableRole(request.role())) {
            throw new RoleChangeNotAllowedException();
        }
        if (target.getRole() == request.role()) {
            return toResponse(target);
        }

        UserRole previous = target.getRole();
        target.changeRole(request.role());
        roleAuditService.logRoleChange(actorId, targetUserId, previous, request.role());
        return toResponse(target);
    }

    @Transactional
    public AdminUserResponse updateStatus(Long actorId, Long targetUserId, UpdateUserStatusRequest request) {
        User actor = findActiveUser(actorId);
        if (!StaffRolePolicy.canManageMemberStatus(actor.getRole())) {
            throw new RoleChangeNotAllowedException();
        }

        if (actorId.equals(targetUserId)) {
            throw new RoleChangeNotAllowedException();
        }

        User target = findActiveUser(targetUserId);
        if (target.getRole() == UserRole.SUPER_ADMIN) {
            throw new RoleChangeNotAllowedException();
        }
        if (request.status() == UserStatus.DELETED) {
            throw new RoleChangeNotAllowedException();
        }
        if (target.getStatus() == request.status()) {
            return toResponse(target);
        }

        UserStatus previous = target.getStatus();
        if (request.status() == UserStatus.SUSPENDED) {
            target.suspend();
        } else if (request.status() == UserStatus.ACTIVE) {
            target.activate();
        } else {
            throw new RoleChangeNotAllowedException();
        }

        roleAuditService.logStatusChange(actorId, targetUserId, previous, request.status());
        return toResponse(target);
    }

    private void assertCanChangeRole(User actor) {
        if (!StaffRolePolicy.canChangeRole(actor.getRole())) {
            throw new RoleChangeNotAllowedException();
        }
    }

    private User findActiveUser(Long userId) {
        return userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .or(() -> userRepository.findByIdAndStatus(userId, UserStatus.SUSPENDED))
                .orElseThrow(UserNotFoundException::new);
    }

    private Long parseUserId(String keyword) {
        try {
            return Long.parseLong(keyword.replaceFirst("^#", ""));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private AdminUserResponse toResponse(User user) {
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseThrow(UserNotFoundException::new);
        return AdminUserResponse.of(user, profile);
    }

    private Map<Long, UserProfile> loadProfiles(List<User> users) {
        List<Long> userIds = users.stream().map(User::getId).toList();
        if (userIds.isEmpty()) {
            return Map.of();
        }
        return userProfileRepository.findByUser_IdIn(userIds).stream()
                .collect(Collectors.toMap(profile -> profile.getUser().getId(), Function.identity()));
    }
}
