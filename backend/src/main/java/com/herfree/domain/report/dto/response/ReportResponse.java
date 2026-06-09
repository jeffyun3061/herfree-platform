package com.herfree.domain.report.dto.response;

import com.herfree.domain.report.entity.Report;
import java.time.LocalDateTime;

// 신고 응답 DTO — 관리자 목록 조회와 처리 결과 모두에 사용한다.
public record ReportResponse(
        Long id,
        Long reporterId,
        String targetType,
        Long targetId,
        String reason,
        String detail,
        String status,
        Long processedBy,
        LocalDateTime processedAt,
        LocalDateTime createdAt
) {
    public static ReportResponse from(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getReporter().getId(),
                report.getTargetType().name(),
                report.getTargetId(),
                report.getReason(),
                report.getDetail(),
                report.getStatus().name(),
                report.getProcessedBy(),
                report.getProcessedAt(),
                report.getCreatedAt()
        );
    }
}
