package com.herfree.domain.reaction.dto.response;

// 반응 토글 결과 응답 DTO
// added=true면 반응이 추가됐고, added=false면 반응이 취소됐음을 의미한다.
// 클라이언트는 이 값으로 버튼 활성 상태를 즉시 반영할 수 있다.
public record ReactionResponse(
        boolean added,
        String reactionType,
        Long targetId,
        String targetType
) {
}
