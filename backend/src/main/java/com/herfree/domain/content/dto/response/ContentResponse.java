package com.herfree.domain.content.dto.response;

import com.herfree.domain.content.entity.Content;
import java.time.LocalDateTime;

public record ContentResponse(
        Long id,
        String title,
        String content,
        String category,
        String contentType,
        Long authorId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ContentResponse from(Content content) {
        return new ContentResponse(
                content.getId(),
                content.getTitle(),
                content.getContent(),
                content.getCategory(),
                content.getContentType().name(),
                content.getAuthor().getId(),
                content.getCreatedAt(),
                content.getUpdatedAt()
        );
    }
}
