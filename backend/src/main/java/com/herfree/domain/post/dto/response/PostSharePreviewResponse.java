package com.herfree.domain.post.dto.response;

import com.herfree.domain.post.entity.Post;

public record PostSharePreviewResponse(Long id, String title, String description, String boardType, String mode) {
    public static PostSharePreviewResponse full(Post post) {
        String plain = post.getContent() == null ? "" : post.getContent().replaceAll("[\\p{Cntrl}\\p{Z}]+", " ").trim();
        if (plain.codePointCount(0, plain.length()) > 180) {
            plain = plain.substring(0, plain.offsetByCodePoints(0, 180)).stripTrailing() + "…";
        }
        return new PostSharePreviewResponse(post.getId(), post.getTitle(), plain, post.getBoard().getBoardType(), "FULL");
    }

    public static PostSharePreviewResponse titleOnly(Post post) {
        return new PostSharePreviewResponse(post.getId(), post.getTitle(), "로그인하면 글을 볼 수 있어요.", post.getBoard().getBoardType(), "TITLE_ONLY");
    }
}
