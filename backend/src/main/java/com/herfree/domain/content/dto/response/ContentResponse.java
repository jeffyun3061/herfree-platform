package com.herfree.domain.content.dto.response;

import com.herfree.domain.content.entity.Content;
import java.time.LocalDateTime;

public record ContentResponse(
        Long id,
        Long authorId,
        String title,
        String content,
        String category,
        String contentType,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ContentResponse from(Content content) {
        return new ContentResponse(
                content.getId(),
                content.getAuthor().getId(),
                content.getTitle(),
                content.getContent(),
                content.getCategory(),
                content.getContentType(),
                content.getCreatedAt(),
                content.getUpdatedAt()
        );
    }
}
