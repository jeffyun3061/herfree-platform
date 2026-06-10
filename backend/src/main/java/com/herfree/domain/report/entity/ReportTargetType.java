package com.herfree.domain.report.entity;

// 신고 대상 타입 — USER까지 포함해 게시글·댓글·사용자를 하나의 신고 테이블로 관리한다
public enum ReportTargetType {
    POST,
    COMMENT,
    USER
}
