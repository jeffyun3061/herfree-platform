package com.herfree.domain.comment.dto.response;

import com.herfree.domain.comment.entity.Comment;
import java.time.LocalDateTime;

// 댓글 응답 DTO — 익명 여부에 따라 닉네임을 마스킹한다.
public record CommentResponse(
        Long id,
        Long postId,
        Long parentId,
        String content,
        String authorNickname,
        boolean isMyComment,
        LocalDateTime createdAt
) {
    public static CommentResponse of(Comment comment, String nickname, boolean isMyComment) {
        String displayNickname = (comment.isAnonymous() && !isMyComment) ? "익명" : nickname;
        return new CommentResponse(
                comment.getId(),
                comment.getPost().getId(),
                comment.getParent() != null ? comment.getParent().getId() : null,
                comment.getContent(),
                displayNickname,
                isMyComment,
                comment.getCreatedAt()
        );
    }
}
