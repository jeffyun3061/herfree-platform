package com.herfree.domain.auth.dto.request;

import com.herfree.domain.auth.policy.CredentialPolicy;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetConfirmRequest(

        @NotBlank(message = "재설정 토큰이 필요합니다.")
        String token,

        @NotBlank(message = "새 비밀번호를 입력해 주세요.")
        @Size(
                min = CredentialPolicy.PASSWORD_MIN_LENGTH,
                max = CredentialPolicy.PASSWORD_MAX_LENGTH,
                message = CredentialPolicy.PASSWORD_LENGTH_MESSAGE
        )
        @Pattern(
                regexp = CredentialPolicy.PASSWORD_SPECIAL_CHAR_PATTERN,
                message = CredentialPolicy.PASSWORD_SPECIAL_CHAR_MESSAGE
        )
        String newPassword
) {
}
