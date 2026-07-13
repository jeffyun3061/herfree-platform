package com.herfree.domain.auth.service;

import com.herfree.domain.auth.dto.request.PasswordResetConfirmRequest;
import com.herfree.domain.auth.dto.request.PasswordResetRequest;
import com.herfree.domain.auth.entity.PasswordResetToken;
import com.herfree.domain.auth.exception.InvalidPasswordResetTokenException;
import com.herfree.domain.auth.repository.PasswordResetTokenRepository;
import com.herfree.domain.analytics.service.AnalyticsService;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.config.PasswordResetProperties;
import com.herfree.global.util.TokenHashUtil;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    public static final String REQUEST_SUCCESS_MESSAGE =
            "등록된 이메일이면 비밀번호 재설정 안내를 보냈습니다. 메일함을 확인해 주세요.";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordResetMailService passwordResetMailService;
    private final PasswordResetProperties passwordResetProperties;
    private final PasswordEncoder passwordEncoder;
    private final AnalyticsService analyticsService;

    @Transactional
    public void requestReset(PasswordResetRequest request) {
        userRepository.findByEmail(request.email())
                .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .ifPresent(this::issueResetToken);
    }

    @Transactional
    public void confirmReset(PasswordResetConfirmRequest request) {
        String tokenHash = TokenHashUtil.sha256Hex(request.token());
        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenHashAndUsedAtIsNull(tokenHash)
                .orElseThrow(InvalidPasswordResetTokenException::new);

        if (resetToken.isExpired() || resetToken.isUsed()) {
            throw new InvalidPasswordResetTokenException();
        }

        User user = resetToken.getUser();
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new InvalidPasswordResetTokenException();
        }

        user.changePassword(passwordEncoder.encode(request.newPassword()));
        resetToken.markUsed();
    }

    private void issueResetToken(User user) {
        invalidateActiveTokens(user.getId());

        String rawToken = UUID.randomUUID().toString();
        String tokenHash = TokenHashUtil.sha256Hex(rawToken);
        Instant expiresAt = Instant.now()
                .plus(passwordResetProperties.tokenExpirationMinutes(), ChronoUnit.MINUTES);

        passwordResetTokenRepository.save(
                PasswordResetToken.create(user, tokenHash, expiresAt));

        String resetUrl = buildResetUrl(rawToken);
        passwordResetMailService.sendPasswordResetEmail(user.getEmail(), resetUrl);
        recordAnalyticsEvent(AnalyticsService.PASSWORD_RESET_REQUESTED, user.getId());
    }

    private void invalidateActiveTokens(Long userId) {
        List<PasswordResetToken> activeTokens = passwordResetTokenRepository.findByUserIdAndUsedAtIsNull(userId);
        for (PasswordResetToken token : activeTokens) {
            token.markUsed();
        }
    }

    private String buildResetUrl(String rawToken) {
        String baseUrl = passwordResetProperties.frontendBaseUrl();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl + "/reset-password?token=" + rawToken;
    }

    private void recordAnalyticsEvent(String eventName, Long userId) {
        if (analyticsService != null) {
            analyticsService.recordBackendEvent(eventName, userId);
        }
    }
}
