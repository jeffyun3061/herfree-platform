package com.herfree.domain.user.entity;

import com.herfree.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Receipt/review only. This entity never claims that original data or backups have been erased. */
@Entity @Getter @Table(name = "community_deletion_requests")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommunityDeletionRequest extends BaseTimeEntity {
    public enum Status { RECEIVED, IN_REVIEW }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "withdrawal_consent_id", nullable = false, unique = true)
    private CommunityHealthConsent withdrawalConsent;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Status status;
    @Column(name = "post_count", nullable = false) private int postCount;
    @Column(name = "comment_count", nullable = false) private int commentCount;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "acknowledged_by") private User acknowledgedBy;
    @Column(name = "acknowledged_at") private Instant acknowledgedAt;
    public CommunityDeletionRequest(User user, CommunityHealthConsent withdrawal, int posts, int comments) {
        this.user = user; this.withdrawalConsent = withdrawal; this.postCount = posts; this.commentCount = comments;
        this.status = Status.RECEIVED;
    }
    public void acknowledge(User actor, Instant now) {
        if (status == Status.RECEIVED) {
            status = Status.IN_REVIEW; acknowledgedBy = actor; acknowledgedAt = now;
        }
    }
}
