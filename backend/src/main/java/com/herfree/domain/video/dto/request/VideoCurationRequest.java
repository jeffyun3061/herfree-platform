package com.herfree.domain.video.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record VideoCurationRequest(
        @Min(value = 0, message = "정렬값은 0 이상이어야 합니다.")
        @Max(value = 1000000, message = "정렬값이 너무 큽니다.")
        Integer sortOrder,
        Boolean isFeatured,
        Boolean isVisible
) {
}
