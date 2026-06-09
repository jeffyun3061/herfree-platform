package com.herfree.domain.content.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ContentUpdateRequest(

        @NotBlank String title,

        @NotBlank String content,

        @NotBlank String category
) {
}
