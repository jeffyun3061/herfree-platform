package com.herfree.domain.report.entity;

// 신고 처리 상태 — PENDING이 기본값이며, 관리자 검토 후 ACCEPTED 또는 REJECTED로 변경된다
public enum ReportStatus {
    PENDING,
    ACCEPTED,
    REJECTED
}
