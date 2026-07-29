package com.herfree.domain.report.controller;

import com.herfree.domain.report.dto.request.ReportProcessRequest;
import com.herfree.domain.report.dto.request.ReportDecisionRequest;
import com.herfree.domain.report.dto.response.AdminReportTargetResponse;
import com.herfree.domain.report.dto.response.ReportResponse;
import com.herfree.domain.report.entity.ReportStatus;
import com.herfree.domain.report.entity.ReportTargetType;
import com.herfree.domain.report.service.ReportService;
import com.herfree.domain.report.service.ReportModerationFacade;
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

// 관리자 전용 신고 관리 API — 신고 목록 조회와 처리를 담당한다
@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final ReportService reportService;
    private final ReportModerationFacade reportModerationFacade;

    // status 파라미터가 없으면 PENDING(처리 대기) 신고만 조회한다
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReportResponse>>> getReports(
            @RequestParam(defaultValue = "PENDING") ReportStatus status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getReports(status, pageable)));
    }

    @GetMapping("/targets")
    public ResponseEntity<ApiResponse<java.util.List<AdminReportTargetResponse>>> getReportTargets(
            @RequestParam(defaultValue = "1") int minCount,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getPendingTargets(minCount, size)));
    }

    @PatchMapping("/{reportId}/process")
    public ResponseEntity<ApiResponse<ReportResponse>> processReport(
            @AuthenticationPrincipal Long adminId,
            @PathVariable Long reportId,
            @Valid @RequestBody ReportProcessRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.processReport(adminId, reportId, request)));
    }

    @PatchMapping("/{reportId}/decision")
    public ResponseEntity<ApiResponse<ReportResponse>> decideReport(
            @AuthenticationPrincipal Long adminId,
            @PathVariable Long reportId,
            @Valid @RequestBody ReportDecisionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                reportModerationFacade.decideReport(adminId, reportId, request)));
    }

    @PatchMapping("/targets/{targetType}/{targetId}/process")
    public ResponseEntity<ApiResponse<java.util.List<ReportResponse>>> processTargetReports(
            @AuthenticationPrincipal Long adminId,
            @PathVariable ReportTargetType targetType,
            @PathVariable Long targetId,
            @Valid @RequestBody ReportProcessRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.processTargetReports(adminId, targetType, targetId, request)));
    }

    @PatchMapping("/targets/{targetType}/{targetId}/decision")
    public ResponseEntity<ApiResponse<java.util.List<ReportResponse>>> decideTarget(
            @AuthenticationPrincipal Long adminId,
            @PathVariable ReportTargetType targetType,
            @PathVariable Long targetId,
            @Valid @RequestBody ReportDecisionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                reportModerationFacade.decideTarget(adminId, targetType, targetId, request)));
    }
}
