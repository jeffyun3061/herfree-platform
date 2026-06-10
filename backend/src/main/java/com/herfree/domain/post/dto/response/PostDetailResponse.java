package com.herfree.domain.post.dto.response;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostVisibility;
import java.time.LocalDateTime;

// 게시글 상세 응답 DTO — 목록 응답에 content, visibility, isMyPost 필드를 추가한다
public record PostDetailResponse(
        Long id,
        Long boardId,
        String boardName,
        String title,
        String content,
        String authorNickname,
        int viewCount,
        PostVisibility visibility,
        boolean isAnonymous,
        // 현재 로그인한 사용자가 작성자인지 여부 — 수정/삭제 버튼 표시에 사용된다
        boolean isMyPost,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PostDetailResponse of(Post post, String authorNickname, boolean isMyPost) {
        // 익명 글인 경우 닉네임 마스킹 — 단, 본인 글이면 실명 표시를 허용한다
        String displayNickname = (post.isAnonymous() && !isMyPost) ? "익명" : authorNickname;
        return new PostDetailResponse(
                post.getId(),
                post.getBoard().getId(),
                post.getBoard().getName(),
                post.getTitle(),
                post.getContent(),
                displayNickname,
                post.getViewCount(),
                post.getVisibility(),
                post.isAnonymous(),
                isMyPost,
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}
