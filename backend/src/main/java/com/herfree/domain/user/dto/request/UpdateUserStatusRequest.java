package com.herfree.domain.user.dto.request;

import com.herfree.domain.user.entity.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
        @NotNull(message = "계정 상태는 필수입니다.")
        UserStatus status
) {
}
