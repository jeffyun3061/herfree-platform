package com.herfree.domain.auth.service;

import com.herfree.domain.analytics.service.AnalyticsService;
import com.herfree.domain.auth.dto.request.OAuthCompleteProfileRequest;
import com.herfree.domain.auth.dto.request.OAuthLoginRequest;
import com.herfree.domain.auth.dto.response.LoginResponse;
import com.herfree.domain.auth.dto.response.OAuthLoginResponse;
import com.herfree.domain.auth.entity.OAuthProvider;
import com.herfree.domain.auth.entity.UserOAuthAccount;
import com.herfree.domain.auth.exception.OAuthEmailAlreadyRegisteredException;
import com.herfree.domain.auth.exception.OAuthProfileTokenInvalidException;
import com.herfree.domain.auth.oauth.OAuthClient;
import com.herfree.domain.auth.oauth.OAuthClientRegistry;
import com.herfree.domain.auth.oauth.OAuthProviderProfile;
import com.herfree.domain.auth.repository.UserOAuthAccountRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.DuplicateNicknameException;
import com.herfree.domain.user.exception.ReservedNicknameException;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.domain.user.service.UserConsentAgreementService;
import com.herfree.global.security.JwtProperties;
import com.herfree.global.security.JwtTokenProvider;
import com.herfree.global.util.ReservedNicknamePolicy;
import io.jsonwebtoken.JwtException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OAuthAuthService {

    private static final String PENDING_NICKNAME_PREFIX = "pending_";

    private final OAuthClientRegistry oauthClientRegistry;
    private final UserOAuthAccountRepository userOAuthAccountRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;
    private final AnalyticsService analyticsService;
    private final UserConsentAgreementService userConsentAgreementService;

    @Transactional
    public OAuthLoginResponse loginWithCode(OAuthProvider provider, OAuthLoginRequest request) {
        oauthClientRegistry.assertConfigured(provider);
        OAuthClient client = oauthClientRegistry.requireClient(provider);
        OAuthProviderProfile profile = client.fetchProfile(
                request.code(),
                request.redirectUri(),
                request.state()
        );

        Optional<UserOAuthAccount> linkedAccount = userOAuthAccountRepository
                .findByProviderAndProviderUserId(provider, profile.providerUserId());

        if (linkedAccount.isPresent()) {
            return OAuthLoginResponse.completed(issueLoginResponse(linkedAccount.get().getUser()));
        }

        String resolvedEmail = profile.resolveEmail(provider);
        if (profile.email() != null && userRepository.existsByEmail(resolvedEmail)) {
            throw new OAuthEmailAlreadyRegisteredException();
        }

        User user = User.builder()
                .email(resolvedEmail)
                .password(passwordEncoder.encode("oauth:" + UUID.randomUUID()))
                .build();
        userRepository.save(user);

        userOAuthAccountRepository.save(UserOAuthAccount.builder()
                .user(user)
                .provider(provider)
                .providerUserId(profile.providerUserId())
                .build());

        String pendingNickname = generatePendingNickname();
        UserProfile userProfile = UserProfile.builder()
                .user(user)
                .nickname(pendingNickname)
                .profileImageUrl(profile.profileImageUrl())
                .isPublic(true)
                .build();
        userProfileRepository.save(userProfile);

        String profileCompletionToken = jwtTokenProvider.createProfileCompletionToken(String.valueOf(user.getId()));
        recordAnalyticsEvent("oauth_signup_started", user.getId());
        return OAuthLoginResponse.needsProfile(profileCompletionToken, user.getId());
    }

    @Transactional
    public LoginResponse completeProfile(OAuthCompleteProfileRequest request) {
        Long userId;
        try {
            userId = jwtTokenProvider.validateProfileCompletionToken(request.profileCompletionToken());
        } catch (JwtException ex) {
            throw new OAuthProfileTokenInvalidException();
        }

        User user = userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(OAuthProfileTokenInvalidException::new);

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(OAuthProfileTokenInvalidException::new);

        if (!profile.getNickname().startsWith(PENDING_NICKNAME_PREFIX)) {
            throw new OAuthProfileTokenInvalidException();
        }

        String nickname = request.nickname().trim();
        if (ReservedNicknamePolicy.isReserved(nickname)) {
            throw new ReservedNicknameException();
        }
        if (userProfileRepository.existsByNickname(nickname)) {
            throw new DuplicateNicknameException();
        }

        profile.updateNickname(nickname);
        userConsentAgreementService.recordSignupConsent(user, request.agreeAge(), request.agreeMarketing());
        recordAnalyticsEvent("oauth_signup_completed", user.getId());
        return issueLoginResponse(user);
    }

    private LoginResponse issueLoginResponse(User user) {
        if (user.getStatus() == UserStatus.SUSPENDED) {
            if (user.isSuspensionExpired(Instant.now())) {
                user.activate();
            } else {
                throw new com.herfree.domain.auth.exception.SuspendedAccountException();
            }
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UserNotFoundException();
        }

        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseThrow(UserNotFoundException::new);

        String accessToken = jwtTokenProvider.createAccessToken(
                String.valueOf(user.getId()),
                user.getRole().name()
        );

        recordAnalyticsEvent("oauth_login_completed", user.getId());

        return new LoginResponse(
                accessToken,
                "Bearer",
                jwtProperties.accessExpirationSeconds(),
                user.getId(),
                profile.getNickname(),
                user.getRole()
        );
    }

    private String resolveInitialNickname(String providerNickname) {
        if (providerNickname == null || providerNickname.isBlank()) {
            return null;
        }
        String nickname = providerNickname.trim();
        if (nickname.length() < 2 || nickname.length() > 20) {
            return null;
        }
        if (ReservedNicknamePolicy.isReserved(nickname) || userProfileRepository.existsByNickname(nickname)) {
            return null;
        }
        return nickname;
    }

    private String generatePendingNickname() {
        String nickname;
        do {
            nickname = PENDING_NICKNAME_PREFIX + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        } while (userProfileRepository.existsByNickname(nickname));
        return nickname;
    }

    private void recordAnalyticsEvent(String eventName, Long userId) {
        if (analyticsService != null) {
            analyticsService.recordBackendEvent(eventName, userId);
        }
    }
}
