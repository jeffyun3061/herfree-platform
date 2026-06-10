package com.herfree.domain.report.dto.request;

import com.herfree.domain.report.entity.ReportStatus;
import jakarta.validation.constraints.NotNull;

public record ReportProcessRequest(
        // ACCEPTED 또는 REJECTED만 허용 — PENDING으로 되돌리는 것은 관리자 UX상 불필요하다
        @NotNull(message = "처리 상태는 필수입니다.")
        ReportStatus status,

        // 처리 메모 — 관리자가 왜 인정/기각했는지 내부 기록용
        String processNote
) {
}
