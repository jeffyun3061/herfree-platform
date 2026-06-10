package com.herfree.domain.product.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ProductUpdateRequest(
        @NotBlank(message = "제품명은 필수입니다.")
        String name,

        @NotBlank(message = "카테고리는 필수입니다.")
        String category,

        String imageUrl,
        String description,
        Integer price,
        String externalUrl
) {
}
