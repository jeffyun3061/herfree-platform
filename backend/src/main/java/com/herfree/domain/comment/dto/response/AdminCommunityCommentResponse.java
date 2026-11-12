package com.herfree.domain.comment.dto.response;

import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.post.entity.PostStatus;
import java.time.Instant;

public record AdminCommunityCommentResponse(
        Long id,
        Long postId,
        String postTitle,
        PostStatus postStatus,
        String contentPreview,
        CommentStatus status,
        String authorNickname,
        Instant createdAt
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
                comment.getPost().getStatus() == PostStatus.DELETED ? "삭제된 게시글" : comment.getPost().getTitle(),
                comment.getPost().getStatus(),
                preview,
                comment.getStatus(),
                com.herfree.global.util.AnonymousConcernPolicy.isConcernBoard(comment.getPost().getBoard().getBoardType())
                        ? "익명" : authorNickname,
                comment.getCreatedAt()
        );
    }
}
