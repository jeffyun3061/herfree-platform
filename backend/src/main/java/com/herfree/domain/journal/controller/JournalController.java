package com.herfree.domain.journal.controller;

import com.herfree.domain.journal.dto.request.JournalRecordUpsertRequest;
import com.herfree.domain.journal.dto.response.JournalDashboardResponse;
import com.herfree.domain.journal.dto.response.JournalInsightsResponse;
import com.herfree.domain.journal.dto.response.JournalRecordResponse;
import com.herfree.domain.journal.dto.response.JournalReviewSummaryResponse;
import com.herfree.domain.journal.service.JournalService;
import com.herfree.global.response.ApiResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/journal")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService journalService;

    @PostMapping("/records")
    public ResponseEntity<ApiResponse<JournalRecordResponse>> upsertRecord(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody JournalRecordUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(journalService.upsertRecord(userId, request)));
    }

    @GetMapping("/records")
    public ResponseEntity<ApiResponse<Page<JournalRecordResponse>>> getMyRecords(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) Boolean hadSymptoms,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(journalService.getMyRecords(userId, hadSymptoms, pageable)));
    }

    @GetMapping("/records/{recordId}")
    public ResponseEntity<ApiResponse<JournalRecordResponse>> getRecord(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long recordId
    ) {
        return ResponseEntity.ok(ApiResponse.success(journalService.getRecord(userId, recordId)));
    }

    @DeleteMapping("/records/{recordId}")
    public ResponseEntity<Void> deleteRecord(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long recordId
    ) {
        journalService.deleteRecord(userId, recordId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/records/by-date")
    public ResponseEntity<ApiResponse<JournalRecordResponse>> getRecordByDate(
            @AuthenticationPrincipal Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        JournalRecordResponse response = journalService.getRecordByDate(userId, date).orElse(null);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<JournalDashboardResponse>> getDashboard(
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.success(journalService.getDashboard(userId)));
    }

    @GetMapping("/review-summary")
    public ResponseEntity<ApiResponse<JournalReviewSummaryResponse>> getReviewSummary(
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.success(journalService.getReviewSummary(userId)));
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<JournalInsightsResponse>> getInsights() {
        return ResponseEntity.ok(ApiResponse.success(journalService.getCommunityInsights()));
    }
}
