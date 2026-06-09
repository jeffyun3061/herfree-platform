package com.herfree.domain.comment.entity;

// 댓글 상태 — 삭제된 댓글도 DB에 남겨 신고·감사 이력을 보존한다
public enum CommentStatus {

    // 정상 노출 상태
    ACTIVE,

    // 관리자 숨김 처리 — 신고 수락 등 운영 조치 시 전환
    HIDDEN,

    // 작성자 삭제 또는 회원 탈퇴 연동 soft delete
    DELETED
}
