package com.herfree.domain.user.entity;

import com.herfree.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Separate, append-only decisions for public anonymous community health content. No content is copied here. */
@Entity
@Getter
@Table(name = "community_health_consents")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommunityHealthConsent extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(nullable = false) private boolean agreed;
    @Column(name = "policy_version", nullable = false, length = 20) private String policyVersion;
    @Column(nullable = false, length = 50) private String purpose;
    @Column(name = "decided_at", nullable = false, updatable = false) private Instant decidedAt;

    public CommunityHealthConsent(User user, boolean agreed, String version, String purpose, Instant decidedAt) {
        this.user = user; this.agreed = agreed; this.policyVersion = version;
        this.purpose = purpose; this.decidedAt = decidedAt;
    }
}
