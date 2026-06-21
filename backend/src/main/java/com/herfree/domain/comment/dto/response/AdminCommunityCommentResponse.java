package com.herfree.domain.comment.dto.response;

import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.entity.CommentStatus;
import java.time.LocalDateTime;

public record AdminCommunityCommentResponse(
        Long id,
        Long postId,
        String postTitle,
        String contentPreview,
        CommentStatus status,
        String authorNickname,
        LocalDateTime createdAt
) {
    private static final int PREVIEW_MAX = 80;

    public static AdminCommunityCommentResponse from(Comment comment, String authorNickname) {
        String content = comment.getContent();
        String preview = content.length() <= PREVIEW_MAX
                ? content
                : content.substring(0, PREVIEW_MAX) + "…";
        return new AdminCommunityCommentResponse(
                comment.getId(),
                comment.getPost().getId(),
                comment.getPost().getTitle(),
                preview,
                comment.getStatus(),
                authorNickname,
                comment.getCreatedAt()
        );
    }
}
