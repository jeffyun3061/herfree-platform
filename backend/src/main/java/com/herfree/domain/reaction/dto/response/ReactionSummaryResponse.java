package com.herfree.domain.reaction.dto.response;

import com.herfree.domain.reaction.entity.ReactionTargetType;
import com.herfree.domain.reaction.entity.ReactionType;
import java.util.List;

// 대상별 반응 집계 — 초기 UI 표시용 (토글 전 counts·reacted 상태)
public record ReactionSummaryResponse(
        ReactionTargetType targetType,
        Long targetId,
        List<ReactionCountItem> counts
) {
    public record ReactionCountItem(
            ReactionType reactionType,
            long totalCount,
            boolean reacted
    ) {
    }
}
