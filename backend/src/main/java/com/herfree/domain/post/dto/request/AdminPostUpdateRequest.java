package com.herfree.domain.post.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminPostUpdateRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String content
) {
}
