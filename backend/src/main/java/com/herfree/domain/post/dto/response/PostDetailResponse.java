package com.herfree.domain.post.dto.response;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.global.util.AnonymousNicknamePolicy;
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
        String imageUrl,
        boolean staffReplied,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PostDetailResponse of(Post post, String authorNickname, boolean isMyPost, String imageUrl) {
        return of(post, authorNickname, isMyPost, imageUrl, false);
    }

    public static PostDetailResponse of(
            Post post,
            String authorNickname,
            boolean isMyPost,
            String imageUrl,
            boolean staffReplied
    ) {
        String displayNickname = AnonymousNicknamePolicy.displayNickname(
                post.isAnonymous(), isMyPost, authorNickname);
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
                imageUrl,
                staffReplied,
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}
