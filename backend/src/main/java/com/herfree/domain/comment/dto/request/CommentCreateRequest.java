package com.herfree.domain.comment.dto.request;

import jakarta.validation.constraints.NotBlank;

// 댓글 작성 요청 DTO
// parentId는 대댓글 작성 시에만 전달한다 — null이면 최상위 댓글로 처리한다.
public record CommentCreateRequest(

        @NotBlank String content,

        // 대댓글 확장을 위해 미리 포함해두는 필드 — 1차 MVP에서 null로 보내면 최상위 댓글이 된다
        Long parentId,

        boolean isAnonymous
) {
}
