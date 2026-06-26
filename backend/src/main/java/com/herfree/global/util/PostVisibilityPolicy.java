package com.herfree.global.util;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.exception.PostNotFoundException;
import com.herfree.domain.user.entity.UserRole;

public final class PostVisibilityPolicy {

    private PostVisibilityPolicy() {
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
