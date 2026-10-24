package com.herfree.domain.post.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminPostUpdateRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String content,
        @Size(max = 200000) String richContent
) {
    public AdminPostUpdateRequest(String title, String content) { this(title, content, null); }
}
