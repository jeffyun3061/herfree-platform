package com.herfree.global.util;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.exception.PostNotFoundException;
import com.herfree.domain.user.entity.UserRole;

public final class PostVisibilityPolicy {

    private PostVisibilityPolicy() {
    }

    /** The same anonymous rule is used by detail responses and crawler previews. */
    public static boolean isPublicShareable(Post post) {
        return post.getStatus() == PostStatus.ACTIVE
                && post.getVisibility() == PostVisibility.PUBLIC
                && !PrivateBoardPolicy.isAdminMaskedBoard(post.getBoard().getBoardType());
    }

    public static boolean isTitleOnlyShareable(Post post) {
        return post.getStatus() == PostStatus.ACTIVE
                && post.getVisibility() == PostVisibility.MEMBERS_ONLY
                && post.isShareTitlePublicly()
                && !PrivateBoardPolicy.isAdminMaskedBoard(post.getBoard().getBoardType());
    }

    public static boolean isShareable(Post post) {
        return isPublicShareable(post) || isTitleOnlyShareable(post);
    }

    public static void assertReadable(Post post, Long viewerId, UserRole viewerRole) {
        if (post.getVisibility() == PostVisibility.MEMBERS_ONLY && viewerId == null) {
            throw new PostNotFoundException();
        }

        // 비밀사연: 상세 페이지 진입은 허용하고 본문은 응답 단계에서 마스킹한다
        if (PrivateBoardPolicy.isSecretStoryBoard(post.getBoard().getBoardType())) {
            return;
        }

        if (!PrivateBoardPolicy.canViewerReadPost(post, viewerId, viewerRole)) {
            throw new PostNotFoundException();
        }
    }
}
