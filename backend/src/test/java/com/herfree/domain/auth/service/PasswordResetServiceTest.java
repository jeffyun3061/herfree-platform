package com.herfree.domain.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.herfree.domain.auth.dto.request.PasswordResetConfirmRequest;
import com.herfree.domain.auth.dto.request.PasswordResetRequest;
import com.herfree.domain.auth.entity.PasswordResetToken;
import com.herfree.domain.auth.exception.InvalidPasswordResetTokenException;
import com.herfree.domain.auth.repository.PasswordResetTokenRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.config.PasswordResetProperties;
import com.herfree.global.util.TokenHashUtil;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock
    private PasswordResetMailService passwordResetMailService;
    @Mock
    private PasswordResetProperties passwordResetProperties;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PasswordResetService passwordResetService;

    @Test
    @DisplayName("등록된 활성 계정이면 재설정 토큰을 발급하고 메일을 보낸다")
    void requestReset_activeUser_issuesToken() {
        User user = User.builder()
                .email("user@test.com")
                .password("encoded")
                .status(UserStatus.ACTIVE)
                .build();
        ReflectionTestUtils.setField(user, "id", 1L);
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(passwordResetTokenRepository.findByUserIdAndUsedAtIsNull(user.getId())).willReturn(List.of());
        given(passwordResetProperties.tokenExpirationMinutes()).willReturn(30);
        given(passwordResetProperties.frontendBaseUrl()).willReturn("http://localhost:3000");

        passwordResetService.requestReset(new PasswordResetRequest("user@test.com"));

        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        verify(passwordResetMailService).sendPasswordResetEmail(eq("user@test.com"), any(String.class));
    }

    @Test
    @DisplayName("유효한 토큰이면 비밀번호를 변경하고 토큰을 사용 처리한다")
    void confirmReset_validToken_updatesPassword() {
        String rawToken = "test-reset-token-uuid";
        User user = User.builder()
                .email("user@test.com")
                .password("old-encoded")
                .status(UserStatus.ACTIVE)
                .build();
        PasswordResetToken token = PasswordResetToken.create(
                user,
                TokenHashUtil.sha256Hex(rawToken),
                LocalDateTime.now().plusMinutes(30));

        given(passwordResetTokenRepository.findByTokenHashAndUsedAtIsNull(TokenHashUtil.sha256Hex(rawToken)))
                .willReturn(Optional.of(token));
        given(passwordEncoder.encode("Newpass123!")).willReturn("new-encoded");

        passwordResetService.confirmReset(new PasswordResetConfirmRequest(rawToken, "Newpass123!"));

        assertThat(user.getPassword()).isEqualTo("new-encoded");
        assertThat(token.isUsed()).isTrue();
    }

    @Test
    @DisplayName("만료된 토큰이면 InvalidPasswordResetTokenException")
    void confirmReset_expiredToken_throws() {
        String rawToken = "expired-token";
        User user = User.builder().email("user@test.com").password("pw").build();
        PasswordResetToken token = PasswordResetToken.create(
                user,
                TokenHashUtil.sha256Hex(rawToken),
                LocalDateTime.now().minusMinutes(1));

        given(passwordResetTokenRepository.findByTokenHashAndUsedAtIsNull(TokenHashUtil.sha256Hex(rawToken)))
                .willReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.confirmReset(
                new PasswordResetConfirmRequest(rawToken, "Newpass123!")))
                .isInstanceOf(InvalidPasswordResetTokenException.class);
    }
}
