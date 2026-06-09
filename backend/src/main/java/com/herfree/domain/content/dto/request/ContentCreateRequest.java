package com.herfree.domain.content.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ContentCreateRequest(

        @NotBlank String title,

        @NotBlank String content,

        @NotBlank String category,

        // "CREATOR", "DOCTOR", "ADMIN" 중 하나
        @NotNull String contentType
) {
}
