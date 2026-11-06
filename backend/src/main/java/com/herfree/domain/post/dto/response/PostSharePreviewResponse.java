package com.herfree.domain.post.dto.response;

import com.herfree.domain.post.entity.Post;

public record PostSharePreviewResponse(Long id, String title, String description, String boardType) {
    public static PostSharePreviewResponse from(Post post) {
        String description = "NOTICE".equals(post.getBoard().getBoardType())
                ? "헤르프리 공지사항을 확인해 주세요." : "로그인 후 게시글을 확인해 주세요.";
        return new PostSharePreviewResponse(post.getId(), post.getTitle(), description, post.getBoard().getBoardType());
    }
}
