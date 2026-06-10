package com.herfree.domain.reaction.dto.response;

import com.herfree.domain.reaction.entity.ReactionTargetType;
import com.herfree.domain.reaction.entity.ReactionType;

// 반응 응답 DTO — 토글 후 현재 상태와 집계 수를 함께 반환해 클라이언트 재조회를 줄인다
public record ReactionResponse(
        ReactionTargetType targetType,
        Long targetId,
        ReactionType reactionType,
        // 토글 후 해당 대상의 전체 반응 수 — 클라이언트가 바로 UI를 갱신할 수 있다
        long totalCount,
        // 현재 사용자가 해당 반응을 등록했는지 여부
        boolean reacted
) {
}
