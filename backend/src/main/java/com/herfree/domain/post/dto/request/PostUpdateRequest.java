package com.herfree.domain.post.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// 게시글 수정 요청 DTO — 게시판 이동은 허용하지 않으므로 boardId는 포함하지 않는다
public record PostUpdateRequest(

        @NotBlank
        @Size(max = 200)
        String title,

        @NotBlank
        String content,

        boolean isAnonymous
) {
}
