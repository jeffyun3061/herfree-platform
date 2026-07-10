package com.herfree.domain.post.dto.response;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import java.time.Instant;

public record AdminNoticeResponse(
        Long id,
        String title,
        String content,
        PostStatus status,
        int sortOrder,
        boolean isPinned,
        Instant createdAt
) {
    public static AdminNoticeResponse from(Post post) {
        return new AdminNoticeResponse(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getStatus(),
                post.getSortOrder(),
                post.isPinned(),
                post.getCreatedAt()
        );
    }
}
