package com.herfree.domain.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.herfree.domain.auth.dto.request.OAuthCompleteProfileRequest;
import com.herfree.domain.auth.dto.request.OAuthLoginRequest;
import com.herfree.domain.auth.entity.OAuthProvider;
import com.herfree.domain.auth.entity.UserOAuthAccount;
import com.herfree.domain.auth.exception.OAuthAuthenticationFailedException;
import com.herfree.domain.auth.exception.OAuthEmailAlreadyRegisteredException;
import com.herfree.domain.auth.exception.OAuthRedirectUriMismatchException;
import com.herfree.domain.auth.oauth.OAuthClient;
import com.herfree.domain.auth.oauth.OAuthClientRegistry;
import com.herfree.domain.auth.oauth.OAuthProviderProfile;
import com.herfree.domain.auth.repository.UserOAuthAccountRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.domain.user.service.UserConsentAgreementService;
import com.herfree.domain.user.service.HealthStatisticsConsentService;
import com.herfree.domain.user.service.HealthDataConsentService;
import com.herfree.global.security.JwtProperties;
import com.herfree.global.security.JwtTokenProvider;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OAuthAuthServiceTest {

    @Mock
    private OAuthClientRegistry oauthClientRegistry;

    @Mock
    private UserOAuthAccountRepository userOAuthAccountRepository;

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
    private UserConsentAgreementService userConsentAgreementService;

    @Mock
    private HealthStatisticsConsentService healthStatisticsConsentService;

    @Mock
    private HealthDataConsentService healthDataConsentService;

    @Mock
    private OAuthClient oauthClient;

    @InjectMocks
    private OAuthAuthService oauthAuthService;

    @BeforeEach
    void setUp() {
        given(jwtProperties.accessExpirationSeconds()).willReturn(3600L);
    }

    @Test
    @DisplayName("서버 설정과 다른 OAuth Callback URI는 외부 요청 전에 거부한다")
    void loginWithCode_redirectUriMismatch_rejectsBeforeProviderCall() {
        OAuthLoginRequest request = new OAuthLoginRequest(
                "code",
                "https://wrong.example/auth/callback/naver",
                "state-naver"
        );
        willThrow(new OAuthRedirectUriMismatchException())
                .given(oauthClientRegistry)
                .assertRedirectUri(OAuthProvider.NAVER, request.redirectUri());

        assertThatThrownBy(() -> oauthAuthService.loginWithCode(OAuthProvider.NAVER, request))
                .isInstanceOf(OAuthRedirectUriMismatchException.class);
        verifyNoInteractions(oauthClient);
    }

    @Test
    @DisplayName("기존 소셜 연동 계정은 JWT를 발급한다")
    void loginWithCode_existingAccount_issuesJwt() {
        User user = User.builder()
                .email("kakao_1@oauth.herfree.local")
                .password("hash")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 10L);

        UserOAuthAccount linked = UserOAuthAccount.builder()
                .user(user)
                .provider(OAuthProvider.KAKAO)
                .providerUserId("12345")
                .build();

        UserProfile profile = UserProfile.builder()
                .user(user)
                .nickname("헤르프리유저")
                .isPublic(true)
                .build();

        given(oauthClientRegistry.requireClient(OAuthProvider.KAKAO)).willReturn(oauthClient);
        given(oauthClient.fetchProfile("code", "http://localhost:3000/auth/callback/kakao", "state-1"))
                .willReturn(OAuthProviderProfile.of("12345", null, "헤르프리유저", null));
        given(userOAuthAccountRepository.findByProviderAndProviderUserId(OAuthProvider.KAKAO, "12345"))
                .willReturn(Optional.of(linked));
        given(userProfileRepository.findByUserId(10L)).willReturn(Optional.of(profile));
        given(jwtTokenProvider.createAccessToken("10", "USER", 0)).willReturn("jwt-token");

        var response = oauthAuthService.loginWithCode(
                OAuthProvider.KAKAO,
                new OAuthLoginRequest("code", "http://localhost:3000/auth/callback/kakao", "state-1")
        );

        assertThat(response.needsProfile()).isFalse();
        assertThat(response.accessToken()).isEqualTo("jwt-token");
        assertThat(response.nickname()).isEqualTo("헤르프리유저");
    }

    @Test
    @DisplayName("동일 이메일 가입 계정이 있으면 소셜 로그인을 거절한다")
    void loginWithCode_emailAlreadyRegistered_throwsConflict() {
        given(oauthClientRegistry.requireClient(OAuthProvider.GOOGLE)).willReturn(oauthClient);
        given(oauthClient.fetchProfile(anyString(), anyString(), anyString()))
                .willReturn(OAuthProviderProfile.of("google-sub", "demo@herfree.local", "데모", null));
        given(userOAuthAccountRepository.findByProviderAndProviderUserId(OAuthProvider.GOOGLE, "google-sub"))
                .willReturn(Optional.empty());
        given(userRepository.existsByEmail("demo@herfree.local")).willReturn(true);

        OAuthLoginRequest request = new OAuthLoginRequest(
                "code",
                "http://localhost:3000/auth/callback/google",
                "state-google"
        );
        assertThatThrownBy(() -> oauthAuthService.loginWithCode(OAuthProvider.GOOGLE, request))
                .isInstanceOf(OAuthEmailAlreadyRegisteredException.class);
    }

    @Test
    @DisplayName("OAuth 제공자가 254자를 넘는 이메일을 반환하면 가입을 거부한다")
    void loginWithCode_tooLongEmail_rejectsAccountCreation() {
        String longEmail = "a".repeat(243) + "@example.com";
        given(oauthClientRegistry.requireClient(OAuthProvider.GOOGLE)).willReturn(oauthClient);
        given(oauthClient.fetchProfile(anyString(), anyString(), anyString()))
                .willReturn(OAuthProviderProfile.of("google-long-email", longEmail, "데모", null));
        given(userOAuthAccountRepository.findByProviderAndProviderUserId(
                OAuthProvider.GOOGLE, "google-long-email"))
                .willReturn(Optional.empty());

        assertThatThrownBy(() -> oauthAuthService.loginWithCode(
                OAuthProvider.GOOGLE,
                new OAuthLoginRequest(
                        "code",
                        "http://localhost:3000/auth/callback/google",
                        "state-google"
                )
        )).isInstanceOf(OAuthAuthenticationFailedException.class);
        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("닉네임 미확정 소셜 가입은 profileCompletionToken을 반환한다")
    void loginWithCode_newAccountWithoutNickname_needsProfile() {
        given(oauthClientRegistry.requireClient(OAuthProvider.NAVER)).willReturn(oauthClient);
        given(oauthClient.fetchProfile(anyString(), anyString(), anyString()))
                .willReturn(OAuthProviderProfile.of("naver-1", null, null, null));
        given(userOAuthAccountRepository.findByProviderAndProviderUserId(OAuthProvider.NAVER, "naver-1"))
                .willReturn(Optional.empty());
        given(userRepository.existsByEmail("naver_naver-1@oauth.herfree.local")).willReturn(false);
        given(passwordEncoder.encode(anyString())).willReturn("encoded");
        given(userRepository.save(any(User.class))).willAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            org.springframework.test.util.ReflectionTestUtils.setField(saved, "id", 20L);
            return saved;
        });
        given(userProfileRepository.existsByNickname(anyString())).willReturn(false);
        given(jwtTokenProvider.createProfileCompletionToken("20")).willReturn("profile-token");

        var response = oauthAuthService.loginWithCode(
                OAuthProvider.NAVER,
                new OAuthLoginRequest(
                        "code",
                        "http://localhost:3000/auth/callback/naver",
                        "state-naver"
                )
        );

        assertThat(response.needsProfile()).isTrue();
        assertThat(response.profileCompletionToken()).isEqualTo("profile-token");
        verify(userOAuthAccountRepository).save(any(UserOAuthAccount.class));
    }

    @Test
    @DisplayName("프로필 완료 후 JWT를 발급한다")
    void completeProfile_pendingNickname_issuesJwt() {
        User user = User.builder()
                .email("naver_naver-1@oauth.herfree.local")
                .password("hash")
                .status(UserStatus.ACTIVE)
                .build();
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 20L);

        UserProfile profile = UserProfile.builder()
                .user(user)
                .nickname("pending_ab12cd34")
                .isPublic(true)
                .build();

        given(jwtTokenProvider.validateProfileCompletionToken("profile-token")).willReturn(20L);
        given(userRepository.findByIdAndStatus(20L, UserStatus.ACTIVE)).willReturn(Optional.of(user));
        given(userProfileRepository.findByUserId(20L)).willReturn(Optional.of(profile));
        given(userProfileRepository.existsByNickname("새닉네임")).willReturn(false);
        given(jwtTokenProvider.createAccessToken("20", "USER", 0)).willReturn("jwt-after-profile");

        var response = oauthAuthService.completeProfile(
                new OAuthCompleteProfileRequest(
                        "profile-token", "새닉네임", true, true, true, true, false, true)
        );

        assertThat(response.accessToken()).isEqualTo("jwt-after-profile");
        assertThat(profile.getNickname()).isEqualTo("새닉네임");
        verify(userConsentAgreementService).recordSignupConsent(user, true, true, false);
        verify(healthStatisticsConsentService).recordInitialConsent(user, true);
        verify(healthDataConsentService).recordInitialConsent(user, true);
    }

    @Test
    @DisplayName("필수 약관과 닉네임을 완료하지 않은 소셜 계정은 액세스 토큰을 받을 수 없다")
    void loginWithCode_pendingAccount_returnsProfileCompletionToken() {
        User user = User.builder()
                .email("naver_1@oauth.herfree.local")
                .password("hash")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 11L);

        UserOAuthAccount linked = UserOAuthAccount.builder()
                .user(user)
                .provider(OAuthProvider.NAVER)
                .providerUserId("pending-123")
                .build();
        UserProfile pendingProfile = UserProfile.builder()
                .user(user)
                .nickname("pending_12345678")
                .isPublic(true)
                .build();

        given(oauthClientRegistry.requireClient(OAuthProvider.NAVER)).willReturn(oauthClient);
        given(oauthClient.fetchProfile("code", "http://localhost:3000/auth/callback/naver", "state-1"))
                .willReturn(OAuthProviderProfile.of("pending-123", null, null, null));
        given(userOAuthAccountRepository.findByProviderAndProviderUserId(OAuthProvider.NAVER, "pending-123"))
                .willReturn(Optional.of(linked));
        given(userProfileRepository.findByUserId(11L)).willReturn(Optional.of(pendingProfile));
        given(jwtTokenProvider.createProfileCompletionToken("11")).willReturn("completion-token");

        var response = oauthAuthService.loginWithCode(
                OAuthProvider.NAVER,
                new OAuthLoginRequest("code", "http://localhost:3000/auth/callback/naver", "state-1")
        );

        assertThat(response.needsProfile()).isTrue();
        assertThat(response.profileCompletionToken()).isEqualTo("completion-token");
        assertThat(response.accessToken()).isNull();
    }
}
