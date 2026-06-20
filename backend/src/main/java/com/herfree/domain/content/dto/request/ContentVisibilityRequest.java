package com.herfree.domain.content.dto.request;

import jakarta.validation.constraints.NotNull;

public record ContentVisibilityRequest(
        @NotNull(message = "노출 여부는 필수입니다.")
        Boolean isVisible
) {
}
