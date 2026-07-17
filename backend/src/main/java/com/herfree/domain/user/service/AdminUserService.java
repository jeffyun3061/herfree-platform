package com.herfree.domain.user.service;

import com.herfree.domain.user.dto.request.UpdateUserRoleRequest;
import com.herfree.domain.analytics.service.AnalyticsService;
import com.herfree.domain.user.dto.request.UpdateUserStatusRequest;
import com.herfree.domain.user.dto.request.ResetNicknameRequest;
import com.herfree.domain.user.dto.request.RestrictUserRequest;
import com.herfree.domain.user.dto.response.AdminUserResponse;
import com.herfree.domain.user.entity.NicknameChangeHistory;
import com.herfree.domain.user.entity.NicknameChangeType;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.RoleChangeNotAllowedException;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.NicknameChangeHistoryRepository;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.util.StaffRolePolicy;
import java.util.List;
import java.util.Map;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 관리자 회원 검색·상태·역할·닉네임 강제 변경.
 * <p>
 * SUPER_ADMIN만 역할 승격 가능, 변경 이력은 {@link RoleAuditService}에 남긴다.
 * MODERATOR는 신고 처리 위주, ADMIN 이상이 콘텐츠·회원 관리.
 */
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final NicknameChangeHistoryRepository nicknameChangeHistoryRepository;
    private final RoleAuditService roleAuditService;
    private final AnalyticsService analyticsService;

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
        recordAnalyticsEvent(AnalyticsService.ADMIN_ACTION, actorId);
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
        recordAnalyticsEvent(AnalyticsService.ADMIN_ACTION, actorId);
        return toResponse(target);
    }

    @Transactional
    public AdminUserResponse restrictUser(Long actorId, Long targetUserId, RestrictUserRequest request) {
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

        Instant suspendedUntil = resolveSuspendedUntil(request);
        UserStatus previous = target.getStatus();
        target.suspend(suspendedUntil, request.reason().trim(), normalizeNote(request.note()));
        roleAuditService.logStatusChange(
                actorId,
                targetUserId,
                previous,
                UserStatus.SUSPENDED,
                request.reason().trim(),
                normalizeNote(request.note()),
                suspendedUntil
        );
        recordAnalyticsEvent(AnalyticsService.ADMIN_ACTION, actorId);
        return toResponse(target);
    }

    @Transactional
    public AdminUserResponse resetNickname(Long actorId, Long targetUserId, ResetNicknameRequest request) {
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

        UserProfile profile = userProfileRepository.findByUserId(targetUserId)
                .orElseThrow(UserNotFoundException::new);
        String oldNickname = profile.getNickname();
        String newNickname = resolveSafeNickname(targetUserId, oldNickname);
        profile.updateNickname(newNickname);
        nicknameChangeHistoryRepository.save(NicknameChangeHistory.builder()
                .user(target)
                .actor(actor)
                .oldNickname(oldNickname)
                .newNickname(newNickname)
                .changeType(NicknameChangeType.ADMIN_RESET)
                .reason(request.reason().trim())
                .build());
        roleAuditService.logNicknameReset(
                actorId,
                targetUserId,
                request.reason().trim(),
                normalizeNote(request.note())
        );
        recordAnalyticsEvent(AnalyticsService.ADMIN_ACTION, actorId);
        return AdminUserResponse.of(target, profile);
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

    private Instant resolveSuspendedUntil(RestrictUserRequest request) {
        if (request.permanent()) {
            return null;
        }
        if (request.days() == null) {
            throw new RoleChangeNotAllowedException();
        }
        return Instant.now().plus(request.days(), ChronoUnit.DAYS);
    }

    private String normalizeNote(String note) {
        return note == null || note.isBlank() ? null : note.trim();
    }

    private String resolveSafeNickname(Long userId, String currentNickname) {
        String base = "사용자" + userId;
        if (base.equals(currentNickname) || !userProfileRepository.existsByNickname(base)) {
            return base;
        }
        return "사용자" + userId + "_" + System.currentTimeMillis();
    }

    private Map<Long, UserProfile> loadProfiles(List<User> users) {
        List<Long> userIds = users.stream().map(User::getId).toList();
        if (userIds.isEmpty()) {
            return Map.of();
        }
        return userProfileRepository.findByUser_IdIn(userIds).stream()
                .collect(Collectors.toMap(profile -> profile.getUser().getId(), Function.identity()));
    }

    private void recordAnalyticsEvent(String eventName, Long userId) {
        if (analyticsService != null) {
            analyticsService.recordBackendEvent(eventName, userId);
        }
    }
}
