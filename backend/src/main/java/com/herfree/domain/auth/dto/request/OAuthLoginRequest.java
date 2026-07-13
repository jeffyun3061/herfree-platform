package com.herfree.domain.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record OAuthLoginRequest(
        @NotBlank String code,
        @NotBlank String redirectUri,
        @NotBlank String state
) {
}
