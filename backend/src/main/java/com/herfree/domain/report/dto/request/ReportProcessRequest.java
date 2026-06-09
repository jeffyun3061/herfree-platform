package com.herfree.domain.report.dto.request;

import jakarta.validation.constraints.NotNull;

// 신고 처리 요청 DTO — 관리자가 ACCEPTED 또는 REJECTED를 선택한다.
public record ReportProcessRequest(

        // "ACCEPTED" 또는 "REJECTED"
        @NotNull String action
) {
}
