package com.herfree.domain.content.dto.response;

import com.herfree.domain.content.entity.Content;
import com.herfree.domain.content.entity.ContentStatus;
import java.time.LocalDateTime;

public record ContentResponse(
        Long id,
        Long authorId,
        String title,
        String content,
        String imageUrl,
        String category,
        String contentType,
        ContentStatus status,
        int sortOrder,
        boolean isPinned,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ContentResponse from(Content content) {
        return new ContentResponse(
                content.getId(),
                content.getAuthor().getId(),
                content.getTitle(),
                content.getContent(),
                content.getImageUrl(),
                content.getCategory(),
                content.getContentType(),
                content.getStatus(),
                content.getSortOrder(),
                content.isPinned(),
                content.getCreatedAt(),
                content.getUpdatedAt()
        );
    }
}
