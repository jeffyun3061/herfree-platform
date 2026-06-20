package com.herfree.domain.post.dto.response;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import java.time.LocalDateTime;

public record AdminNoticeResponse(
        Long id,
        String title,
        String content,
        PostStatus status,
        LocalDateTime createdAt
) {
    public static AdminNoticeResponse from(Post post) {
        return new AdminNoticeResponse(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getStatus(),
                post.getCreatedAt()
        );
    }
}
