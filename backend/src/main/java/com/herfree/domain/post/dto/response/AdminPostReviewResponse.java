package com.herfree.domain.post.dto.response;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;

/** Minimal moderation review data; author identity is not needed for this view. */
public record AdminPostReviewResponse(Long id, String boardName, PostStatus status,
                                      String title, String content, String imageUrl) {
    public static AdminPostReviewResponse of(Post post, String imageUrl) {
        return new AdminPostReviewResponse(post.getId(), post.getBoard().getName(),
                post.getStatus(), post.getTitle(), post.getContent(), imageUrl);
    }
}
