package com.herfree.domain.user.service;

import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserConsentAgreement;
import com.herfree.domain.user.repository.UserConsentAgreementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 이용약관·개인정보·민감정보 동의 이력 — 가입 시 버전과 함께 append-only 저장.
 */
@Service
@RequiredArgsConstructor
public class UserConsentAgreementService {

    private static final String TERMS_VERSION = "2026-06-13";
    private static final String PRIVACY_VERSION = "2026-07-15";

    private final UserConsentAgreementRepository userConsentAgreementRepository;

    public void recordSignupConsent(
            User user,
            boolean sensitiveInfoAgreed,
            boolean ageConfirmed,
            boolean marketingAgreed
    ) {
        userConsentAgreementRepository.save(UserConsentAgreement.builder()
                .user(user)
                .termsVersion(TERMS_VERSION)
                .privacyVersion(PRIVACY_VERSION)
                .sensitiveInfoAgreed(sensitiveInfoAgreed)
                .ageConfirmed(ageConfirmed)
                .marketingAgreed(marketingAgreed)
                .build());
    }
}
