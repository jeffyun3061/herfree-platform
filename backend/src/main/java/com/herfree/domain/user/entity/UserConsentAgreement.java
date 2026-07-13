package com.herfree.domain.user.entity;

import com.herfree.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "user_consent_agreements")
public class UserConsentAgreement extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "terms_version", nullable = false, length = 20)
    private String termsVersion;

    @Column(name = "privacy_version", nullable = false, length = 20)
    private String privacyVersion;

    @Column(name = "age_confirmed", nullable = false)
    private boolean ageConfirmed;

    @Column(name = "marketing_agreed", nullable = false)
    private boolean marketingAgreed;

    @Builder
    private UserConsentAgreement(
            User user,
            String termsVersion,
            String privacyVersion,
            boolean ageConfirmed,
            boolean marketingAgreed
    ) {
        this.user = user;
        this.termsVersion = termsVersion;
        this.privacyVersion = privacyVersion;
        this.ageConfirmed = ageConfirmed;
        this.marketingAgreed = marketingAgreed;
    }
}
