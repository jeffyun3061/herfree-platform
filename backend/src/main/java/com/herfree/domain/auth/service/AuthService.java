package com.herfree.domain.auth.service;

import com.herfree.domain.auth.dto.request.LoginRequest;
import com.herfree.domain.auth.dto.request.SignupRequest;
import com.herfree.domain.auth.dto.response.LoginResponse;
import com.herfree.domain.auth.dto.response.NicknameCheckResponse;
import com.herfree.domain.auth.exception.InvalidLoginCredentialsException;
import com.herfree.domain.auth.exception.LoginLockedException;
import com.herfree.domain.auth.exception.SuspendedAccountException;
import com.herfree.domain.analytics.service.AnalyticsService;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.DuplicateEmailException;
import com.herfree.domain.user.exception.DuplicateNicknameException;
import com.herfree.domain.user.exception.ReservedNicknameException;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.domain.user.service.UserConsentAgreementService;
import com.herfree.domain.user.service.HealthStatisticsConsentService;
import com.herfree.global.security.JwtProperties;
import com.herfree.global.security.JwtTokenProvider;
import com.herfree.global.util.ReservedNicknamePolicy;
import com.herfree.global.util.EmailNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

/**
 * 이메일·비밀번호 회원가입과 로그인.
 * <p>
 * 존재하지 않는 계정과 잘못된 비밀번호는 동일한 오류로 응답하고,
 * {@link LoginLockoutService}로 반복 실패 시 잠금한다. 가입 시 약관·건강통계 동의를 함께 기록한다.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String DUMMY_PASSWORD_HASH =
            "$2a$10$7EqJtq98hPqEX7fNZaFWoOgy6JwSjQpqXr3a6eJFo6TQqqDMljc4u";

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;
    private final LoginLockoutService loginLockoutService;
    private final AnalyticsService analyticsService;
    private final UserConsentAgreementService userConsentAgreementService;
    private final HealthStatisticsConsentService healthStatisticsConsentService;

    // 회원가입 — User와 UserProfile을 같은 트랜잭션에서 함께 저장한다.
    // 프로필 저장이 실패하면 User도 롤백되어 孤立된 인증 레코드가 생기지 않는다.
    @Transactional
    public void signup(SignupRequest request) {
        String email = EmailNormalizer.normalize(request.email());
        // 이메일 중복 체크 — DB unique 제약으로도 잡히지만,
        // 명시적으로 검증해야 의도가 담긴 에러 메시지를 내려줄 수 있다.
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateEmailException();
        }

        if (ReservedNicknamePolicy.isReserved(request.nickname())) {
            throw new ReservedNicknameException();
        }

        // 닉네임 중복 체크 — user_profiles.nickname은 unique 컬럼이다.
        if (userProfileRepository.existsByNickname(request.nickname())) {
            throw new DuplicateNicknameException();
        }

        // 평문을 저장하지 않고 현재 표준 인코더로 단방향 해시한다.
        String encodedPassword = passwordEncoder.encode(request.password());

        User user = User.builder()
                .email(email)
                .password(encodedPassword)
                .build();

        userRepository.save(user);

        // User와 UserProfile을 분리 테이블로 관리하는 이유:
        // 인증 정보(이메일·비밀번호)와 커뮤니티 노출 정보(닉네임·이미지)의
        // 변경 주기와 노출 범위가 다르다. 분리하면 각 테이블을 독립적으로 변경·확장할 수 있다.
        UserProfile profile = UserProfile.builder()
                .user(user)
                .nickname(request.nickname())
                .isPublic(true)
                .build();

        userProfileRepository.save(profile);
        userConsentAgreementService.recordSignupConsent(
                user, request.agreeSensitive(), request.agreeAge(), request.agreeMarketing());
        healthStatisticsConsentService.recordInitialConsent(user, request.agreeHealthStatistics());
        recordAnalyticsEvent(AnalyticsService.SIGNUP_COMPLETED, user.getId());
    }

    @Transactional(readOnly = true)
    public NicknameCheckResponse checkNicknameAvailability(String nickname) {
        String trimmed = nickname == null ? "" : nickname.trim();
        if (trimmed.length() < 2 || trimmed.length() > 20) {
            return new NicknameCheckResponse(false);
        }
        if (ReservedNicknamePolicy.isReserved(trimmed)) {
            return new NicknameCheckResponse(false);
        }
        return new NicknameCheckResponse(!userProfileRepository.existsByNickname(trimmed));
    }

    // 로그인 — 이메일로 사용자를 찾고, 비밀번호를 검증한 뒤 JWT를 발급한다.
    @Transactional
    public LoginResponse login(LoginRequest request) {
        String email = EmailNormalizer.normalize(request.email());
        loginLockoutService.assertNotLocked(email);

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // 없는 계정도 BCrypt 검증 비용을 태워 계정 존재 여부의 시간 차이를 줄인다.
            passwordEncoder.matches(request.password(), DUMMY_PASSWORD_HASH);
            throw failLogin(email);
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw failLogin(email);
        }

        // 정지 여부는 비밀번호 검증 성공 뒤에만 알려 계정 탈취자에게 상태 정보를 덜 준다.
        if (user.getStatus() == UserStatus.SUSPENDED) {
            if (user.isSuspensionExpired(Instant.now())) {
                user.activate();
            } else {
                throw new SuspendedAccountException();
            }
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw failLogin(email);
        }

        // 기존 BCrypt 계정은 정상 로그인 시 긴 입력도 안전한 현재 형식으로 점진 전환한다.
        if (passwordEncoder.upgradeEncoding(user.getPassword())) {
            user.changePassword(passwordEncoder.encode(request.password()));
        }

        loginLockoutService.clearFailures(email);
        recordAnalyticsEvent(AnalyticsService.LOGIN_SUCCEEDED, user.getId());

        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseThrow(UserNotFoundException::new);

        // JWT에는 사용자와 발급 시점 문맥을 담되, 실제 역할과 계정 상태는 필터가 DB에서 다시 확인한다.
        String accessToken = jwtTokenProvider.createAccessToken(
                String.valueOf(user.getId()), user.getRole().name(), user.getCredentialVersion());

        return new LoginResponse(
                accessToken,
                "Bearer",
                jwtProperties.accessExpirationSeconds(),
                user.getId(),
                profile.getNickname(),
                user.getRole()
        );
    }

    private RuntimeException failLogin(String email) {
        loginLockoutService.recordFailure(email);
        if (loginLockoutService.isLocked(email)) {
            return new LoginLockedException();
        }
        return new InvalidLoginCredentialsException();
    }

    private void recordAnalyticsEvent(String eventName, Long userId) {
        if (analyticsService != null) {
            analyticsService.recordBackendEvent(eventName, userId);
        }
    }
}
