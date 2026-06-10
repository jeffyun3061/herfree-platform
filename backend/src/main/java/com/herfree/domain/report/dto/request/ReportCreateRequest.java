package com.herfree.domain.report.dto.request;

import com.herfree.domain.report.entity.ReportTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReportCreateRequest(
        @NotNull(message = "신고 대상 타입은 필수입니다.")
        ReportTargetType targetType,

        @NotNull(message = "신고 대상 ID는 필수입니다.")
        Long targetId,

        @NotBlank(message = "신고 사유는 필수입니다.")
        @Size(max = 100, message = "신고 사유는 100자를 초과할 수 없습니다.")
        String reason,

        // 상세 내용은 선택 사항이다
        String detail
) {
}
