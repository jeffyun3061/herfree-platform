package com.herfree.domain.analytics.controller;

import com.herfree.domain.analytics.dto.response.AdminStatsResponse;
import com.herfree.domain.analytics.service.AnalyticsService;
import com.herfree.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
public class AdminStatsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getOverview() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getAdminStats()));
    }
}
