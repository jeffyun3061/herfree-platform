package com.herfree.domain.content.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ContentUpdateRequest(
        @NotBlank(message = "제목은 필수입니다.")
        String title,

        @NotBlank(message = "내용은 필수입니다.")
        String content,

        String imageUrl,

        @NotBlank(message = "카테고리는 필수입니다.")
        String category
) {
}
