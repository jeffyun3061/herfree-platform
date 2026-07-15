package com.herfree.domain.video.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VideoCreateRequest(
        @NotBlank(message = "제목은 필수입니다.")
        @Size(max = 200, message = "제목은 200자를 초과할 수 없습니다.")
        String title,

        @NotBlank(message = "유튜브 URL은 필수입니다.")
        @Size(max = 500, message = "유튜브 URL은 500자를 초과할 수 없습니다.")
        String youtubeUrl,

        @Size(max = 500, message = "썸네일 주소는 500자를 초과할 수 없습니다.")
        String thumbnailUrl,
        @Size(max = 5000, message = "설명은 5000자를 초과할 수 없습니다.")
        String description,
        Long relatedBoardId
) {
}
