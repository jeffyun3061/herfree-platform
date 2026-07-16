package com.herfree.domain.product.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record ProductUpdateRequest(
        @NotBlank(message = "제품명은 필수입니다.")
        @Size(max = 255, message = "제품명은 255자를 초과할 수 없습니다.")
        String name,

        @NotBlank(message = "카테고리는 필수입니다.")
        @Size(max = 50, message = "카테고리는 50자를 초과할 수 없습니다.")
        String category,

        @Size(max = 500, message = "이미지 주소는 500자를 초과할 수 없습니다.")
        String imageUrl,
        @Size(max = 5000, message = "설명은 5000자를 초과할 수 없습니다.")
        String description,
        @PositiveOrZero(message = "가격은 0 이상이어야 합니다.")
        Integer price,
        @Size(max = 500, message = "외부 링크는 500자를 초과할 수 없습니다.")
        String externalUrl
) {
}
