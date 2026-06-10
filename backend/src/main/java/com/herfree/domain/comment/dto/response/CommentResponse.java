package com.herfree.domain.comment.dto.response;

import com.herfree.domain.comment.entity.Comment;
import java.time.LocalDateTime;

// 댓글 응답 DTO — Entity를 직접 노출하지 않아 민감 필드 유출을 방지한다
public record CommentResponse(
        Long id,
        Long postId,
        // 익명 여부에 따라 "익명" 또는 실제 닉네임을 반환한다
        String authorNickname,
        String content,
        boolean isAnonymous,
        Long parentId,
        LocalDateTime createdAt
) {
    public static CommentResponse of(Comment comment, String authorNickname) {
        // 익명 댓글이면 작성자 닉네임을 마스킹한다
        String displayNickname = comment.isAnonymous() ? "익명" : authorNickname;
        return new CommentResponse(
                comment.getId(),
                comment.getPost().getId(),
                displayNickname,
                comment.getContent(),
                comment.isAnonymous(),
                comment.getParent() != null ? comment.getParent().getId() : null,
                comment.getCreatedAt()
        );
    }
}
