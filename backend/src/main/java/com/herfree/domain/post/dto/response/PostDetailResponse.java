package com.herfree.domain.post.dto.response;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.global.util.AnonymousNicknamePolicy;
import com.herfree.global.util.PrivateBoardPolicy;
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
        boolean isMyPost,
        boolean readable,
        String imageUrl,
        boolean staffReplied,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PostDetailResponse of(Post post, String authorNickname, boolean isMyPost, String imageUrl) {
        return of(post, authorNickname, isMyPost, imageUrl, false, null, null);
    }

    public static PostDetailResponse of(
            Post post,
            String authorNickname,
            boolean isMyPost,
            String imageUrl,
            boolean staffReplied
    ) {
        return of(post, authorNickname, isMyPost, imageUrl, staffReplied, null, null);
    }

    public static PostDetailResponse of(
            Post post,
            String authorNickname,
            boolean isMyPost,
            String imageUrl,
            boolean staffReplied,
            Long currentUserId,
            UserRole viewerRole
    ) {
        boolean readable = PrivateBoardPolicy.canViewerReadPost(post, currentUserId, viewerRole);
        boolean mask = PrivateBoardPolicy.shouldMaskInList(post, currentUserId, viewerRole);

        String displayNickname = mask
                ? "비공개"
                : AnonymousNicknamePolicy.displayNickname(post.isAnonymous(), isMyPost, authorNickname);
        String title = mask ? PrivateBoardPolicy.MASKED_TITLE : post.getTitle();
        String content = mask ? PrivateBoardPolicy.SECRET_STORY_DETAIL_MESSAGE : post.getContent();

        return new PostDetailResponse(
                post.getId(),
                post.getBoard().getId(),
                post.getBoard().getName(),
                title,
                content,
                displayNickname,
                post.getViewCount(),
                post.getVisibility(),
                post.isAnonymous(),
                isMyPost,
                readable,
                mask ? null : imageUrl,
                staffReplied,
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}
