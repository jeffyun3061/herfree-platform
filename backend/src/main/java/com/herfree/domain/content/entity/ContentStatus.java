package com.herfree.domain.content.entity;

// 콘텐츠 상태 — 게시글과 동일한 soft delete 정책을 따른다
public enum ContentStatus {
    ACTIVE,
    HIDDEN,
    DELETED
}
