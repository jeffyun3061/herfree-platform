package com.herfree.domain.post.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// 게시글 작성 요청 DTO — boardId 검증은 Service 계층에서 Board 존재 여부 확인으로 처리한다
public record PostCreateRequest(

        // boardId는 URL 파라미터가 아닌 바디에 포함해 단일 엔드포인트로 여러 게시판을 지원한다
        @NotNull
        Long boardId,

        @NotBlank
        @Size(max = 200)
        String title,

        @NotBlank
        String content,

        // false가 기본값 — 클라이언트가 명시하지 않으면 실명 게시글로 처리된다
        boolean isAnonymous,

        // null이면 Service에서 PUBLIC으로 기본 처리한다
        String visibility
) {
}
