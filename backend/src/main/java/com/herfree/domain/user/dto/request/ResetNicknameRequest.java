package com.herfree.domain.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetNicknameRequest(
        @NotBlank(message = "초기화 사유는 필수입니다.")
        @Size(max = 100, message = "초기화 사유는 100자를 초과할 수 없습니다.")
        String reason,

        @Size(max = 1000, message = "운영 메모는 1000자를 초과할 수 없습니다.")
        String note
) {
}
