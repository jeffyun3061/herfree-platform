package com.herfree.domain.comment.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CommentCreateRequest(
        @NotBlank(message = "댓글 내용은 필수입니다.")
        String content,

        boolean isAnonymous,

        // 대댓글 작성 시 부모 댓글 ID — 최상위 댓글이면 null
        Long parentId
) {
}
