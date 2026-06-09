package com.herfree.domain.video.dto.response;

import com.herfree.domain.video.entity.Video;
import java.time.LocalDateTime;

public record VideoResponse(
        Long id,
        String title,
        String youtubeUrl,
        String youtubeVideoId,
        String thumbnailUrl,
        String description,
        Long relatedBoardId,
        LocalDateTime createdAt
) {
    public static VideoResponse from(Video video) {
        return new VideoResponse(
                video.getId(),
                video.getTitle(),
                video.getYoutubeUrl(),
                video.getYoutubeVideoId(),
                video.getThumbnailUrl(),
                video.getDescription(),
                video.getRelatedBoard() != null ? video.getRelatedBoard().getId() : null,
                video.getCreatedAt()
        );
    }
}
