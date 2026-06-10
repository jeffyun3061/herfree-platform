package com.herfree.domain.auth.service;

import com.herfree.domain.auth.dto.request.LoginRequest;
import com.herfree.domain.auth.dto.request.SignupRequest;
import com.herfree.domain.auth.dto.response.LoginResponse;
import com.herfree.domain.auth.exception.InvalidPasswordException;
import com.herfree.domain.auth.exception.SuspendedAccountException;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.DuplicateEmailException;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.security.JwtProperties;
import com.herfree.global.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

// Mockito를 활용해 DB·JWT 의존성 없이 AuthService 비즈니스 로직만 검증한다.
// MockitoExtension을 쓰면 @Mock 필드가 자동으로 초기화된다.
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private JwtProperties jwtProperties;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("정상적인 회원가입 요청 시 User와 UserProfile이 저장된다")
    void signup_success() {
        // given
        SignupRequest request = new SignupRequest("test@test.com", "password123!", "닉네임");

        // 이메일·닉네임 중복 없음
        given(userRepository.existsByEmail(request.email())).willReturn(false);
        given(userProfileRepository.existsByNickname(request.nickname())).willReturn(false);
        given(passwordEncoder.encode(request.password())).willReturn("encoded_password");

        // User save는 저장된 User 객체를 반환하도록 설정한다
        User savedUser = User.builder()
                .email(request.email())
                .password("encoded_password")
                .build();
        given(userRepository.save(any(User.class))).willReturn(savedUser);

        // when
        authService.signup(request);

        // then — User와 UserProfile이 각각 1번 저장되었는지 확인한다
        verify(userRepository).save(any(User.class));
        verify(userProfileRepository).save(any(UserProfile.class));
    }

    @Test
    @DisplayName("이메일이 중복이면 DuplicateEmailException이 발생한다")
    void signup_duplicateEmail_throws() {
        // given — 이미 존재하는 이메일
        SignupRequest request = new SignupRequest("duplicate@test.com", "password123!", "닉네임");
        given(userRepository.existsByEmail(request.email())).willReturn(true);

        // when & then — 이메일 중복 시 409 Conflict에 매핑된 예외가 발생한다
        assertThatThrownBy(() -> authService.signup(request))
                .isInstanceOf(DuplicateEmailException.class);
    }

    @Test
    @DisplayName("올바른 이메일·비밀번호로 로그인하면 AccessToken이 발급된다")
    void login_success_returnsToken() {
        // given
        LoginRequest request = new LoginRequest("test@test.com", "password123!");

        User activeUser = User.builder()
                .email(request.email())
                .password("encoded_password")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();

        UserProfile profile = UserProfile.builder()
                .user(activeUser)
                .nickname("닉네임")
                .isPublic(true)
                .build();

        given(userRepository.findByEmail(request.email())).willReturn(Optional.of(activeUser));
        given(passwordEncoder.matches(request.password(), activeUser.getPassword())).willReturn(true);
        given(userProfileRepository.findByUserId(any())).willReturn(Optional.of(profile));
        given(jwtTokenProvider.createAccessToken(any(), any())).willReturn("mock.jwt.token");
        given(jwtProperties.accessExpirationSeconds()).willReturn(3600L);

        // when
        LoginResponse response = authService.login(request);

        // then — AccessToken이 정상적으로 반환되었는지 확인한다
        assertThat(response.accessToken()).isEqualTo("mock.jwt.token");
        assertThat(response.tokenType()).isEqualTo("Bearer");
    }

    @Test
    @DisplayName("비밀번호가 틀리면 InvalidPasswordException이 발생한다")
    void login_wrongPassword_throws() {
        // given
        LoginRequest request = new LoginRequest("test@test.com", "wrong_password");

        User activeUser = User.builder()
                .email(request.email())
                .password("encoded_password")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();

        given(userRepository.findByEmail(request.email())).willReturn(Optional.of(activeUser));
        // 비밀번호 불일치 — 인증 자격증명 자체가 틀린 경우이므로 401 반환
        given(passwordEncoder.matches(anyString(), anyString())).willReturn(false);

        // when & then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidPasswordException.class);
    }

    @Test
    @DisplayName("정지된 계정으로 로그인하면 SuspendedAccountException이 발생한다")
    void login_suspendedAccount_throws() {
        // given — SUSPENDED 상태 계정은 자격증명이 유효해도 접근 불가
        LoginRequest request = new LoginRequest("test@test.com", "password123!");

        User suspendedUser = User.builder()
                .email(request.email())
                .password("encoded_password")
                .role(UserRole.USER)
                .status(UserStatus.SUSPENDED)
                .build();

        given(userRepository.findByEmail(request.email())).willReturn(Optional.of(suspendedUser));

        // when & then — SUSPENDED 계정은 비밀번호 검증 전에 403 예외가 발생해야 한다
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(SuspendedAccountException.class);
    }
}
