package com.herfree.domain.post.entity;

// 게시글 공개 범위 — PUBLIC은 비로그인 사용자도 볼 수 있고,
// MEMBERS_ONLY는 인증된 회원만 볼 수 있다
public enum PostVisibility {
    PUBLIC,
    MEMBERS_ONLY
}
