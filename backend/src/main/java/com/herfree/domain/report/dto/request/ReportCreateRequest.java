package com.herfree.domain.report.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

// 신고 접수 요청 DTO
public record ReportCreateRequest(

        // "POST", "COMMENT", "USER" 중 하나
        @NotNull String targetType,

        @NotNull Long targetId,

        // 신고 사유 — 프론트엔드에서 선택지로 제공하고 서버에서 검증 없이 저장한다
        @NotBlank String reason,

        // 상세 내용 — 선택 입력
        String detail
) {
}
