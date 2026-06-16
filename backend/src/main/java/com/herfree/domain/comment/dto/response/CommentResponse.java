package com.herfree.domain.comment.dto.response;

import com.herfree.domain.comment.entity.Comment;
import com.herfree.global.util.AnonymousNicknamePolicy;
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
        // 현재 로그인 사용자가 작성자인지 — 삭제 버튼 표시에 사용한다
        boolean isMyComment,
        LocalDateTime createdAt
) {
    public static CommentResponse of(Comment comment, String authorNickname, Long currentUserId) {
        boolean isMyComment = currentUserId != null
                && comment.getUser().getId().equals(currentUserId);
        String displayNickname = AnonymousNicknamePolicy.displayNickname(
                comment.isAnonymous(), isMyComment, authorNickname);
        return new CommentResponse(
                comment.getId(),
                comment.getPost().getId(),
                displayNickname,
                comment.getContent(),
                comment.isAnonymous(),
                comment.getParent() != null ? comment.getParent().getId() : null,
                isMyComment,
                comment.getCreatedAt()
        );
    }
}
