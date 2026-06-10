package com.herfree.domain.video.dto.request;

import jakarta.validation.constraints.NotBlank;

public record VideoUpdateRequest(
        @NotBlank(message = "제목은 필수입니다.")
        String title,

        @NotBlank(message = "유튜브 URL은 필수입니다.")
        String youtubeUrl,

        String thumbnailUrl,
        String description
) {
}
