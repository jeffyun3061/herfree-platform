package com.herfree.domain.comment.entity;

// 댓글 상태 — 게시글과 동일한 soft delete 정책을 따른다
public enum CommentStatus {
    ACTIVE,
    HIDDEN,
    DELETED
}
