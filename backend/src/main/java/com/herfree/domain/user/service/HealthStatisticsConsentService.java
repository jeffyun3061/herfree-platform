package com.herfree.domain.user.service;

import com.herfree.domain.user.dto.response.HealthStatisticsConsentResponse;
import com.herfree.domain.user.entity.HealthStatisticsConsent;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.HealthStatisticsConsentRepository;
import com.herfree.domain.user.repository.UserRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 건강정보 통계 활용 선택 동의 — 수집·철회 이력을 append-only로 보존한다.
 * <p>
 * {@link com.herfree.domain.journal.service.JournalService} 공개 insight 집계는
 * 최신 동의가 {@code agreed=true}인 회원만 포함한다. 정책 버전: {@value #POLICY_VERSION}.
 */
@Service
@RequiredArgsConstructor
public class HealthStatisticsConsentService {

    private static final String POLICY_VERSION = "2026-07-16";

    private final HealthStatisticsConsentRepository consentRepository;
    private final UserRepository userRepository;

    public void recordInitialConsent(User user, boolean agreed) {
        appendConsent(user, agreed);
    }

    @Transactional(readOnly = true)
    public HealthStatisticsConsentResponse getConsent(Long userId) {
        requireActiveUser(userId);
        boolean agreed = consentRepository.findFirstByUserIdOrderByIdDesc(userId)
                .map(HealthStatisticsConsent::isAgreed)
                .orElse(false);
        return new HealthStatisticsConsentResponse(agreed);
    }

    @Transactional
    public HealthStatisticsConsentResponse updateConsent(Long userId, boolean agreed) {
        User user = requireActiveUser(userId);
        Optional<HealthStatisticsConsent> latest = consentRepository.findFirstByUserIdOrderByIdDesc(userId);
        boolean current = latest.map(HealthStatisticsConsent::isAgreed).orElse(false);

        // 변경 이력을 덮어쓰지 않아 동의와 철회 시점을 운영 감사에서 확인할 수 있다.
        if (current != agreed || latest.isEmpty()) {
            appendConsent(user, agreed);
        }
        return new HealthStatisticsConsentResponse(agreed);
    }

    private User requireActiveUser(Long userId) {
        return userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(UserNotFoundException::new);
    }

    private void appendConsent(User user, boolean agreed) {
        consentRepository.save(HealthStatisticsConsent.builder()
                .user(user)
                .agreed(agreed)
                .policyVersion(POLICY_VERSION)
                .build());
    }
}
