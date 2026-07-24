package com.herfree.domain.auth.service;

import com.herfree.domain.auth.dto.request.LoginRequest;
import com.herfree.domain.auth.dto.request.SignupRequest;
import com.herfree.domain.auth.dto.response.LoginResponse;
import com.herfree.domain.auth.exception.InvalidLoginCredentialsException;
import com.herfree.domain.auth.exception.SuspendedAccountException;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.DuplicateEmailException;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.domain.user.service.UserConsentAgreementService;
import com.herfree.domain.user.service.HealthStatisticsConsentService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import org.mockito.ArgumentCaptor;

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

    @Mock
    private LoginLockoutService loginLockoutService;

    @Mock
    private UserConsentAgreementService userConsentAgreementService;

    @Mock
    private HealthStatisticsConsentService healthStatisticsConsentService;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("정상적인 회원가입 요청 시 User와 UserProfile이 저장된다")
    void signup_success() {
        // given
        SignupRequest request = new SignupRequest(
                "test@test.com", "password123!", "닉네임", true, true, true, true, false, true);

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
        verify(userConsentAgreementService).recordSignupConsent(any(User.class), eq(true), eq(true), eq(false));
        verify(healthStatisticsConsentService).recordInitialConsent(any(User.class), eq(true));
    }

    @Test
    @DisplayName("회원가입 이메일은 공백 제거와 소문자 변환 후 저장한다")
    void signup_normalizesEmail() {
        SignupRequest request = new SignupRequest(
                "  User.Name@Example.COM  ", "password123!", "닉네임",
                true, true, true, true, false, false);
        given(userRepository.existsByEmail("user.name@example.com")).willReturn(false);
        given(userProfileRepository.existsByNickname(request.nickname())).willReturn(false);
        given(passwordEncoder.encode(request.password())).willReturn("encoded_password");
        given(userRepository.save(any(User.class))).willAnswer(invocation -> invocation.getArgument(0));

        authService.signup(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isEqualTo("user.name@example.com");
    }

    @Test
    @DisplayName("닉네임 중복 확인 API는 사용 가능 여부를 반환한다")
    void checkNicknameAvailability_returnsAvailability() {
        given(userProfileRepository.existsByNickname("새닉네임")).willReturn(false);
        assertThat(authService.checkNicknameAvailability("새닉네임").available()).isTrue();

        given(userProfileRepository.existsByNickname("기존닉네임")).willReturn(true);
        assertThat(authService.checkNicknameAvailability("기존닉네임").available()).isFalse();
    }

    @Test
    @DisplayName("이메일 중복 확인 API는 사용 가능 여부를 반환한다")
    void checkEmailAvailability_returnsAvailability() {
        given(userRepository.existsByEmail("new@test.com")).willReturn(false);
        assertThat(authService.checkEmailAvailability("new@test.com").available()).isTrue();

        given(userRepository.existsByEmail("duplicate@test.com")).willReturn(true);
        assertThat(authService.checkEmailAvailability("duplicate@test.com").available()).isFalse();

        assertThat(authService.checkEmailAvailability("not-an-email").available()).isFalse();
    }

    @Test
    @DisplayName("이메일이 중복이면 DuplicateEmailException이 발생한다")
    void signup_duplicateEmail_throws() {
        // given — 이미 존재하는 이메일
        SignupRequest request = new SignupRequest(
                "duplicate@test.com", "password123!", "닉네임",
                true, true, true, true, false, false);
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
        org.springframework.test.util.ReflectionTestUtils.setField(activeUser, "id", 1L);

        UserProfile profile = UserProfile.builder()
                .user(activeUser)
                .nickname("닉네임")
                .isPublic(true)
                .build();

        given(userRepository.findByEmail(request.email())).willReturn(Optional.of(activeUser));
        given(passwordEncoder.matches(request.password(), activeUser.getPassword())).willReturn(true);
        given(userProfileRepository.findByUserId(1L)).willReturn(Optional.of(profile));
        given(jwtTokenProvider.createAccessToken(any(), any(), any(Integer.class))).willReturn("mock.jwt.token");
        given(jwtProperties.accessExpirationSeconds()).willReturn(3600L);

        // when
        LoginResponse response = authService.login(request);

        // then — AccessToken이 정상적으로 반환되었는지 확인한다
        assertThat(response.accessToken()).isEqualTo("mock.jwt.token");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        verify(loginLockoutService).clearFailures(request.email());
    }

    @Test
    @DisplayName("기존 비밀번호 해시는 정상 로그인 시 현재 형식으로 자동 전환한다")
    void login_legacyPassword_upgradesEncoding() {
        LoginRequest request = new LoginRequest("legacy@test.com", "legacy-password");
        User activeUser = User.builder()
                .email(request.email())
                .password("legacy_encoded_password")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();
        org.springframework.test.util.ReflectionTestUtils.setField(activeUser, "id", 1L);
        UserProfile profile = UserProfile.builder()
                .user(activeUser)
                .nickname("닉네임")
                .isPublic(true)
                .build();

        given(userRepository.findByEmail(request.email())).willReturn(Optional.of(activeUser));
        given(passwordEncoder.matches(request.password(), "legacy_encoded_password")).willReturn(true);
        given(passwordEncoder.upgradeEncoding("legacy_encoded_password")).willReturn(true);
        given(passwordEncoder.encode(request.password())).willReturn("current_encoded_password");
        given(userProfileRepository.findByUserId(1L)).willReturn(Optional.of(profile));
        given(jwtTokenProvider.createAccessToken(any(), any(), any(Integer.class))).willReturn("mock.jwt.token");
        given(jwtProperties.accessExpirationSeconds()).willReturn(3600L);

        authService.login(request);

        assertThat(activeUser.getPassword()).isEqualTo("current_encoded_password");
    }

    @Test
    @DisplayName("로그인은 이메일 대소문자와 앞뒤 공백에 영향받지 않는다")
    void login_normalizesEmail() {
        LoginRequest request = new LoginRequest("  USER@Test.COM ", "password123!");
        User activeUser = User.builder()
                .email("user@test.com")
                .password("encoded_password")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();
        org.springframework.test.util.ReflectionTestUtils.setField(activeUser, "id", 1L);
        UserProfile profile = UserProfile.builder()
                .user(activeUser)
                .nickname("닉네임")
                .isPublic(true)
                .build();
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(activeUser));
        given(passwordEncoder.matches(request.password(), activeUser.getPassword())).willReturn(true);
        given(userProfileRepository.findByUserId(1L)).willReturn(Optional.of(profile));
        given(jwtTokenProvider.createAccessToken(any(), any(), any(Integer.class))).willReturn("mock.jwt.token");
        given(jwtProperties.accessExpirationSeconds()).willReturn(3600L);

        authService.login(request);

        verify(loginLockoutService).assertNotLocked("user@test.com");
        verify(loginLockoutService).clearFailures("user@test.com");
    }

    @Test
    @DisplayName("비밀번호가 틀리면 InvalidLoginCredentialsException이 발생한다")
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
        given(passwordEncoder.matches(anyString(), anyString())).willReturn(false);
        given(loginLockoutService.isLocked(request.email())).willReturn(false);

        // when & then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidLoginCredentialsException.class);
        verify(loginLockoutService).recordFailure(request.email());
    }

    @Test
    @DisplayName("존재하지 않는 이메일도 더미 BCrypt 검증 후 동일한 로그인 실패 예외를 던진다")
    void login_unknownEmail_usesDummyPasswordHash() {
        LoginRequest request = new LoginRequest("missing@test.com", "wrong_password");

        given(userRepository.findByEmail(request.email())).willReturn(Optional.empty());
        given(loginLockoutService.isLocked(request.email())).willReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidLoginCredentialsException.class);

        verify(passwordEncoder).matches(eq(request.password()), anyString());
        verify(loginLockoutService).recordFailure(request.email());
    }

    @Test
    @DisplayName("예약 닉네임으로 회원가입하면 ReservedNicknameException이 발생한다")
    void signup_reservedNickname_throws() {
        SignupRequest request = new SignupRequest(
                "test@test.com", "password123!", "관리자",
                true, true, true, true, false, false);
        given(userRepository.existsByEmail(request.email())).willReturn(false);

        assertThatThrownBy(() -> authService.signup(request))
                .isInstanceOf(com.herfree.domain.user.exception.ReservedNicknameException.class);
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
        given(passwordEncoder.matches(request.password(), suspendedUser.getPassword())).willReturn(true);

        // when & then — SUSPENDED 계정은 비밀번호 검증 성공 후에만 403 예외가 발생해야 한다
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(SuspendedAccountException.class);
    }

    @Test
    @DisplayName("정지 계정이라도 비밀번호가 틀리면 정지 상태를 노출하지 않는다")
    void login_suspendedAccount_wrongPassword_returnsInvalidCredentials() {
        LoginRequest request = new LoginRequest("test@test.com", "wrong_password");

        User suspendedUser = User.builder()
                .email(request.email())
                .password("encoded_password")
                .role(UserRole.USER)
                .status(UserStatus.SUSPENDED)
                .build();

        given(userRepository.findByEmail(request.email())).willReturn(Optional.of(suspendedUser));
        given(passwordEncoder.matches(request.password(), suspendedUser.getPassword())).willReturn(false);
        given(loginLockoutService.isLocked(request.email())).willReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidLoginCredentialsException.class);
        verify(loginLockoutService).recordFailure(request.email());
        verify(loginLockoutService, never()).clearFailures(request.email());
    }
}
