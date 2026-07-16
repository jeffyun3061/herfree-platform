package com.herfree.domain.auth.dto.request;

import com.herfree.domain.auth.policy.CredentialPolicy;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetRequest(

        @NotBlank(message = "이메일을 입력해 주세요.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        @Size(max = CredentialPolicy.EMAIL_MAX_LENGTH, message = "이메일은 254자를 초과할 수 없습니다.")
        String email
) {
}
