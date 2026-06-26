package com.herfree.domain.post.dto.response;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.global.util.AnonymousNicknamePolicy;
import com.herfree.global.util.PrivateBoardPolicy;
import java.time.LocalDateTime;

// 게시글 목록 응답 DTO — 목록에서는 content를 제외해 페이로드 크기를 줄인다
public record PostResponse(
        Long id,
        Long boardId,
        String boardName,
        String boardType,
        String title,
        String contentPreview,
        String authorNickname,
        int viewCount,
        int commentCount,
        int reactionCount,
        LocalDateTime createdAt,
        boolean isMyPost,
        boolean readable,
        boolean staffReplied
) {
    public static PostResponse of(Post post, String authorNickname, Long currentUserId, UserRole viewerRole) {
        return of(post, authorNickname, currentUserId, viewerRole, false);
    }

    public static PostResponse of(
            Post post,
            String authorNickname,
            Long currentUserId,
            UserRole viewerRole,
            boolean staffReplied
    ) {
        return of(post, authorNickname, currentUserId, viewerRole, staffReplied, 0);
    }

    public static PostResponse of(
            Post post,
            String authorNickname,
            Long currentUserId,
            UserRole viewerRole,
            boolean staffReplied,
            int reactionCount
    ) {
        boolean isMyPost = currentUserId != null && post.getUser().getId().equals(currentUserId);
        boolean readable = PrivateBoardPolicy.canViewerReadPost(post, currentUserId, viewerRole);
        boolean mask = PrivateBoardPolicy.shouldMaskInList(post, currentUserId, viewerRole);

        String displayNickname = mask
                ? "비공개"
                : AnonymousNicknamePolicy.displayNickname(post.isAnonymous(), isMyPost, authorNickname);
        String title = mask ? PrivateBoardPolicy.MASKED_TITLE : post.getTitle();
        String preview = mask ? "" : toPreview(post.getContent());

        return new PostResponse(
                post.getId(),
                post.getBoard().getId(),
                post.getBoard().getName(),
                post.getBoard().getBoardType(),
                title,
                preview,
                displayNickname,
                post.getViewCount(),
                post.getCommentCount(),
                reactionCount,
                post.getCreatedAt(),
                isMyPost,
                readable,
                staffReplied
        );
    }

    private static String toPreview(String content) {
        if (content == null || content.isBlank()) {
            return "";
        }
        String plain = content.replaceAll("\\s+", " ").trim();
        return plain.length() > 80 ? plain.substring(0, 80) + "…" : plain;
    }
}
