package com.herfree.domain.video.dto.request;

import jakarta.validation.constraints.NotBlank;

public record VideoUpdateRequest(

        @NotBlank String title,

        String description
) {
}
