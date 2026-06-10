package com.herfree.domain.product.dto.request;

import jakarta.validation.constraints.NotNull;

public record ProductVisibilityRequest(
        @NotNull(message = "노출 여부는 필수입니다.")
        Boolean isVisible
) {
}
