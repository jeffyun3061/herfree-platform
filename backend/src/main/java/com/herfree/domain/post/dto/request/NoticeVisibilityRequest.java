package com.herfree.domain.post.dto.request;

import jakarta.validation.constraints.NotNull;

public record NoticeVisibilityRequest(
        @NotNull(message = "노출 여부는 필수입니다.")
        Boolean isVisible
) {
}
