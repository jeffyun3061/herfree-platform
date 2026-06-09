package com.herfree.domain.video.dto.request;

import jakarta.validation.constraints.NotBlank;

public record VideoCreateRequest(

        @NotBlank String title,

        // 다양한 유튜브 URL 포맷을 Service에서 파싱해 videoId를 추출한다
        @NotBlank String youtubeUrl,

        String description,

        // 관련 게시판 ID — null이면 특정 게시판에 연결하지 않는다
        Long relatedBoardId
) {
}
