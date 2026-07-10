package com.herfree.domain.report.dto.response;

import com.herfree.domain.report.entity.ReportTargetType;
import java.time.Instant;

public record AdminReportTargetResponse(
        ReportTargetType targetType,
        Long targetId,
        long reportCount,
        boolean urgent,
        Instant lastReportedAt,
        String targetTitle,
        String targetPreview,
        String targetStatus,
        Long authorId,
        String authorNickname
) {
}
