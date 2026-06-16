package com.herfree.domain.user.dto.request;

import com.herfree.domain.user.entity.UserRole;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
        @NotNull(message = "역할은 필수입니다.")
        UserRole role
) {
}
