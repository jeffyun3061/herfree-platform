package com.herfree.domain.reaction.dto.request;

import com.herfree.domain.reaction.entity.ReactionTargetType;
import com.herfree.domain.reaction.entity.ReactionType;
import jakarta.validation.constraints.NotNull;

public record ReactionRequest(
        @NotNull(message = "대상 타입은 필수입니다.")
        ReactionTargetType targetType,

        @NotNull(message = "대상 ID는 필수입니다.")
        Long targetId,

        @NotNull(message = "반응 타입은 필수입니다.")
        ReactionType reactionType
) {
}
