package com.herfree.domain.reaction.dto.request;

import jakarta.validation.constraints.NotNull;

// 반응 등록/취소 요청 DTO
// targetType과 targetId로 어떤 게시글 또는 댓글에 반응하는지 식별한다.
public record ReactionRequest(

        // "POST" 또는 "COMMENT" — Service에서 enum으로 변환한다
        @NotNull String targetType,

        @NotNull Long targetId,

        // 반응 종류 — "EMPATHY", "COMFORT", "HELPFUL", "SUPPORT", "SAME" 중 하나
        @NotNull String reactionType
) {
}
