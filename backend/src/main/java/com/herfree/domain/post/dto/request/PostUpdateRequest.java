package com.herfree.domain.post.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PostUpdateRequest(
        @NotBlank(message = "제목은 필수입니다.")
        @Size(max = 200, message = "제목은 200자를 초과할 수 없습니다.")
        String title,

        @NotBlank(message = "내용은 필수입니다.")
        String content,

        boolean isAnonymous,

        // null이면 기존 이미지 유지, 빈 문자열이면 이미지 제거
        String imageUrl
) {
}
