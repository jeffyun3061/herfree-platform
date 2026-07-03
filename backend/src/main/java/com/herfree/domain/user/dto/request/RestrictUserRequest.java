package com.herfree.domain.user.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RestrictUserRequest(
        boolean permanent,

        @Min(value = 1, message = "정지 기간은 최소 1일입니다.")
        @Max(value = 3650, message = "정지 기간은 최대 3650일입니다.")
        Integer days,

        @NotBlank(message = "제재 사유는 필수입니다.")
        @Size(max = 100, message = "제재 사유는 100자를 초과할 수 없습니다.")
        String reason,

        @Size(max = 1000, message = "운영 메모는 1000자를 초과할 수 없습니다.")
        String note
) {
}
