package com.herfree.domain.content.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContentUpdateRequest(
        @NotBlank(message = "제목은 필수입니다.")
        @Size(max = 200, message = "제목은 200자를 초과할 수 없습니다.")
        String title,

        @NotBlank(message = "내용은 필수입니다.")
        @Size(max = 15000, message = "내용은 15000자를 초과할 수 없습니다.")
        String content,

        @Size(max = 500, message = "이미지 주소는 500자를 초과할 수 없습니다.")
        String imageUrl,

        @NotBlank(message = "카테고리는 필수입니다.")
        @Size(max = 50, message = "카테고리는 50자를 초과할 수 없습니다.")
        String category
) {
}
