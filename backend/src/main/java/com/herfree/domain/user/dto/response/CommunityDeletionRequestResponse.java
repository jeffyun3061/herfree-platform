package com.herfree.domain.user.dto.response;
import com.herfree.domain.user.entity.CommunityDeletionRequest;
import com.herfree.domain.user.entity.CommunityDeletionRequestItem;
import java.time.Instant;
import java.util.List;
public record CommunityDeletionRequestResponse(Long id, CommunityDeletionRequest.Status status, int postCount,
        int commentCount, Instant receivedAt, Instant acknowledgedAt, String policyVersion, String purpose,
        List<Item> items) {
    public record Item(CommunityDeletionRequestItem.TargetType targetType, Long targetId) {}
    public static CommunityDeletionRequestResponse of(CommunityDeletionRequest r, List<CommunityDeletionRequestItem> items) {
        return new CommunityDeletionRequestResponse(r.getId(),r.getStatus(),r.getPostCount(),r.getCommentCount(),
                r.getCreatedAt(),r.getAcknowledgedAt(),r.getWithdrawalConsent().getPolicyVersion(),r.getWithdrawalConsent().getPurpose(),
                items.stream().map(i -> new Item(i.getTargetType(),i.getTargetId())).toList());
    }
}
