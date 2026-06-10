package com.herfree.domain.post.dto.request;

import com.herfree.domain.post.entity.PostVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PostCreateRequest(
        @NotNull(message = "게시판 ID는 필수입니다.")
        Long boardId,

        @NotBlank(message = "제목은 필수입니다.")
        @Size(max = 200, message = "제목은 200자를 초과할 수 없습니다.")
        String title,

        @NotBlank(message = "내용은 필수입니다.")
        String content,

        // 미입력 시 false(실명) 처리 — 클라이언트가 명시적으로 true를 보내야 익명이 된다
        boolean isAnonymous,

        // 미입력 시 PUBLIC으로 처리
        PostVisibility visibility
) {
}
