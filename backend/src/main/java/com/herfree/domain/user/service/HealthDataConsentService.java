package com.herfree.domain.user.service;

import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.user.dto.response.HealthDataConsentResponse;
import com.herfree.domain.user.entity.HealthDataConsent;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.HealthDataConsentRepository;
import com.herfree.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Owns the append-only consent history for personal journal health information.
 * The latest decision is the only decision used for access control.
 */
@Service
@RequiredArgsConstructor
public class HealthDataConsentService {

    public static final String POLICY_VERSION = "2026-08-04";
    private static final String SOURCE_SIGNUP = "SIGNUP";
    private static final String SOURCE_JOURNAL_GATE = "JOURNAL_GATE";

    private final HealthDataConsentRepository consentRepository;
    private final UserRepository userRepository;
    private final JournalRecordRepository journalRecordRepository;

    @Transactional(readOnly = true)
    public HealthDataConsentResponse getConsent(Long userId) {
        requireActiveUser(userId);
        return latestResponse(userId);
    }

    @Transactional
    public HealthDataConsentResponse recordInitialConsent(User user, boolean agreed) {
        appendConsent(user, agreed, SOURCE_SIGNUP);
        return new HealthDataConsentResponse(agreed, POLICY_VERSION);
    }

    @Transactional
    public HealthDataConsentResponse updateConsent(Long userId, boolean agreed) {
        User user = requireActiveUser(userId);
        HealthDataConsentResponse current = latestResponse(userId);
        if (current.agreed() == agreed && POLICY_VERSION.equals(current.policyVersion())) {
            if (!agreed) {
                // Keep revocation destructive even when the same decision is
                // submitted again, repairing rows created before this endpoint.
                journalRecordRepository.deleteAllByUserId(userId);
            }
            return current;
        }

        // Journal data exists only for the consented purpose. Revocation deletes
        // the user's records in the same transaction before access is closed.
        if (!agreed) {
            journalRecordRepository.deleteAllByUserId(userId);
        }
        appendConsent(user, agreed, SOURCE_JOURNAL_GATE);
        return new HealthDataConsentResponse(agreed, POLICY_VERSION);
    }

    @Transactional(readOnly = true)
    public void assertAgreed(Long userId) {
        requireActiveUser(userId);
        if (!latestAgreed(userId)) {
            throw new HealthDataConsentRequiredException();
        }
    }

    public boolean hasAgreed(Long userId) {
        return latestAgreed(userId);
    }

    private boolean latestAgreed(Long userId) {
        return consentRepository.findFirstByUserIdOrderByIdDesc(userId)
                .map(consent -> consent.isAgreed() && POLICY_VERSION.equals(consent.getPolicyVersion()))
                .orElse(false);
    }

    private HealthDataConsentResponse latestResponse(Long userId) {
        return consentRepository.findFirstByUserIdOrderByIdDesc(userId)
                .map(consent -> new HealthDataConsentResponse(
                        consent.isAgreed() && POLICY_VERSION.equals(consent.getPolicyVersion()),
                        consent.getPolicyVersion()))
                .orElseGet(() -> new HealthDataConsentResponse(false, null));
    }

    private User requireActiveUser(Long userId) {
        return userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(UserNotFoundException::new);
    }

    private void appendConsent(User user, boolean agreed, String source) {
        consentRepository.save(HealthDataConsent.builder()
                .user(user)
                .agreed(agreed)
                .policyVersion(POLICY_VERSION)
                .source(source)
                .build());
    }
}
