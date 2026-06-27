package com.herfree.domain.analytics.controller;

import com.herfree.domain.analytics.dto.request.EventLogRequest;
import com.herfree.domain.analytics.service.AnalyticsService;
import com.herfree.global.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> recordEvent(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody EventLogRequest request,
            HttpServletRequest httpRequest
    ) {
        analyticsService.recordFrontendEvent(request, userId, httpRequest);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
