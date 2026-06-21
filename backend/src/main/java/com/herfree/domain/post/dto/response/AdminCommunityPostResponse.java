package com.herfree.domain.post.dto.response;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import java.time.LocalDateTime;

public record AdminCommunityPostResponse(
        Long id,
        String title,
        String boardName,
        PostStatus status,
        String authorNickname,
        LocalDateTime createdAt
) {
    public static AdminCommunityPostResponse from(Post post, String authorNickname) {
        return new AdminCommunityPostResponse(
                post.getId(),
                post.getTitle(),
                post.getBoard().getName(),
                post.getStatus(),
                authorNickname,
                post.getCreatedAt()
        );
    }
}
