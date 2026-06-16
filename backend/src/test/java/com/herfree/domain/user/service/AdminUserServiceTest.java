package com.herfree.domain.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.herfree.domain.user.dto.request.UpdateUserRoleRequest;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.RoleChangeNotAllowedException;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserProfileRepository userProfileRepository;
    @Mock
    private RoleAuditService roleAuditService;

    @InjectMocks
    private AdminUserService adminUserService;

    @Test
    void superAdminCanPromoteUserToModerator() {
        User actor = user(1L, UserRole.SUPER_ADMIN);
        User target = user(2L, UserRole.USER);
        UserProfile profile = profile(target, "member");

        given(userRepository.findByIdAndStatus(1L, UserStatus.ACTIVE)).willReturn(Optional.of(actor));
        given(userRepository.findByIdAndStatus(2L, UserStatus.ACTIVE)).willReturn(Optional.of(target));
        given(userProfileRepository.findByUserId(2L)).willReturn(Optional.of(profile));

        var result = adminUserService.updateRole(1L, 2L, new UpdateUserRoleRequest(UserRole.MODERATOR));

        assertThat(result.role()).isEqualTo(UserRole.MODERATOR);
        verify(roleAuditService).logRoleChange(1L, 2L, UserRole.USER, UserRole.MODERATOR);
    }

    @Test
    void adminCannotChangeRole() {
        User actor = user(1L, UserRole.ADMIN);
        given(userRepository.findByIdAndStatus(1L, UserStatus.ACTIVE)).willReturn(Optional.of(actor));

        assertThatThrownBy(() ->
                adminUserService.updateRole(1L, 2L, new UpdateUserRoleRequest(UserRole.MODERATOR)))
                .isInstanceOf(RoleChangeNotAllowedException.class);
    }

    private User user(Long id, UserRole role) {
        User user = User.builder().email(id + "@test.com").password("encoded").role(role).build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private UserProfile profile(User user, String nickname) {
        return UserProfile.builder().user(user).nickname(nickname).build();
    }
}
