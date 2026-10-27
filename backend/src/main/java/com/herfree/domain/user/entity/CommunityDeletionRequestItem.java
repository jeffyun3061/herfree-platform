package com.herfree.domain.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** References only; deliberately no title, body, nickname, email or health-value fields. */
@Entity @Getter @Table(name = "community_deletion_request_items")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommunityDeletionRequestItem {
    public enum TargetType { POST, COMMENT }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "request_id", nullable = false)
    private CommunityDeletionRequest request;
    @Enumerated(EnumType.STRING) @Column(name = "target_type", nullable = false, length = 20) private TargetType targetType;
    @Column(name = "target_id", nullable = false) private Long targetId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "source_consent_id", nullable = false)
    private CommunityHealthConsent sourceConsent;
    public CommunityDeletionRequestItem(CommunityDeletionRequest request, TargetType type, Long targetId, CommunityHealthConsent source) {
        this.request = request; this.targetType = type; this.targetId = targetId; this.sourceConsent = source;
    }
}
