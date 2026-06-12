package com.herfree.domain.journal.controller;

import com.herfree.domain.journal.dto.response.AdminJournalStatsResponse;
import com.herfree.domain.journal.service.JournalService;
import com.herfree.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/journal")
@RequiredArgsConstructor
public class AdminJournalController {

    private final JournalService journalService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminJournalStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(journalService.getAdminStats()));
    }
}
