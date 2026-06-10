package com.herfree.domain.report.dto.response;

import com.herfree.domain.report.entity.Report;
import com.herfree.domain.report.entity.ReportStatus;
import com.herfree.domain.report.entity.ReportTargetType;
import java.time.LocalDateTime;

public record ReportResponse(
        Long id,
        Long reporterId,
        ReportTargetType targetType,
        Long targetId,
        String reason,
        String detail,
        ReportStatus status,
        Long processedById,
        LocalDateTime processedAt,
        LocalDateTime createdAt
) {
    public static ReportResponse from(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getReporter().getId(),
                report.getTargetType(),
                report.getTargetId(),
                report.getReason(),
                report.getDetail(),
                report.getStatus(),
                report.getProcessedBy() != null ? report.getProcessedBy().getId() : null,
                report.getProcessedAt(),
                report.getCreatedAt()
        );
    }
}
