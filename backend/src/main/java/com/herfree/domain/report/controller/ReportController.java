package com.herfree.domain.report.controller;

import com.herfree.domain.report.dto.request.ReportCreateRequest;
import com.herfree.domain.report.dto.response.ReportResponse;
import com.herfree.domain.report.service.ReportService;
import com.herfree.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 신고 API — 로그인한 사용자만 신고할 수 있다.
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReportResponse>> createReport(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ReportCreateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(reportService.createReport(userId, request)));
    }
}
