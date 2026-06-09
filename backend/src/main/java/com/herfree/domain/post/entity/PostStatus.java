package com.herfree.domain.post.entity;

// 게시글 상태 — soft delete 정책에 따라 물리 삭제 대신 상태값으로 관리한다
// ACTIVE: 정상 노출, HIDDEN: 관리자/신고 처리로 숨김, DELETED: 작성자 또는 탈퇴로 삭제
public enum PostStatus {
    ACTIVE,
    HIDDEN,
    DELETED
}
