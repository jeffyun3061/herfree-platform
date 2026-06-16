package com.herfree.global.util;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.exception.PostNotFoundException;

public final class PostVisibilityPolicy {

    private PostVisibilityPolicy() {
    }

    public static void assertReadable(Post post, Long viewerId) {
        if (post.getVisibility() == PostVisibility.MEMBERS_ONLY && viewerId == null) {
            throw new PostNotFoundException();
        }
    }
}
