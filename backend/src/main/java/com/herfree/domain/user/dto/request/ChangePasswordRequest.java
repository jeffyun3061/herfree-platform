package com.herfree.domain.user.dto.request;

import com.herfree.domain.auth.policy.CredentialPolicy;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(

        @NotBlank(message = "현재 비밀번호를 입력해 주세요.")
        @Size(max = CredentialPolicy.PASSWORD_MAX_LENGTH, message = "비밀번호는 64자를 초과할 수 없습니다.")
        String currentPassword,

        @NotBlank(message = "새 비밀번호를 입력해 주세요.")
        @Size(
                min = CredentialPolicy.PASSWORD_MIN_LENGTH,
                max = CredentialPolicy.PASSWORD_MAX_LENGTH,
                message = "비밀번호는 15자 이상 64자 이하여야 합니다."
        )
        String newPassword
) {
}
