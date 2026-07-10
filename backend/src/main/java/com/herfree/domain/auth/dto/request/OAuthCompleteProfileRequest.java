package com.herfree.domain.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OAuthCompleteProfileRequest(
        @NotBlank String profileCompletionToken,
        @NotBlank @Size(min = 2, max = 20) String nickname
) {
}
