package com.herfree.domain.report.controller;

import com.herfree.domain.report.dto.request.ReportProcessRequest;
import com.herfree.domain.report.dto.response.ReportResponse;
import com.herfree.domain.report.service.ReportService;
import com.herfree.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// 신고 관리자 API — ROLE_ADMIN 권한 전용
@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final ReportService reportService;

    // 신고 목록 조회 — status 쿼리 파라미터로 필터링 가능
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReportResponse>>> getReports(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getReports(status, pageable)));
    }

    // 신고 처리 — ACCEPTED 또는 REJECTED
    @PatchMapping("/{reportId}/process")
    public ResponseEntity<ApiResponse<ReportResponse>> processReport(
            @AuthenticationPrincipal Long adminId,
            @PathVariable Long reportId,
            @Valid @RequestBody ReportProcessRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(reportService.processReport(adminId, reportId, request)));
    }
}
