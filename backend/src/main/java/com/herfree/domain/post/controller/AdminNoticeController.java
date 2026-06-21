package com.herfree.domain.post.controller;

import com.herfree.domain.post.dto.request.NoticeCreateRequest;
import com.herfree.domain.post.dto.request.NoticeCurationRequest;
import com.herfree.domain.post.dto.request.NoticeUpdateRequest;
import com.herfree.domain.post.dto.request.NoticeVisibilityRequest;
import com.herfree.domain.post.dto.response.AdminNoticeResponse;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.service.AdminNoticeService;
import com.herfree.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/notices")
@RequiredArgsConstructor
public class AdminNoticeController {

    private final AdminNoticeService adminNoticeService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminNoticeResponse>>> getNotices(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) PostStatus status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(adminNoticeService.getNotices(keyword, status, pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminNoticeResponse>> createNotice(
            @AuthenticationPrincipal Long adminId,
            @Valid @RequestBody NoticeCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(adminNoticeService.createNotice(adminId, request)));
    }

    @PatchMapping("/{postId}")
    public ResponseEntity<ApiResponse<AdminNoticeResponse>> updateNotice(
            @PathVariable Long postId,
            @Valid @RequestBody NoticeUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminNoticeService.updateNotice(postId, request)));
    }

    @PatchMapping("/{postId}/visibility")
    public ResponseEntity<ApiResponse<AdminNoticeResponse>> updateVisibility(
            @PathVariable Long postId,
            @Valid @RequestBody NoticeVisibilityRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminNoticeService.updateVisibility(postId, request)));
    }

    @PatchMapping("/{postId}/curation")
    public ResponseEntity<ApiResponse<AdminNoticeResponse>> updateCuration(
            @PathVariable Long postId,
            @RequestBody NoticeCurationRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminNoticeService.updateCuration(postId, request)));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> deleteNotice(@PathVariable Long postId) {
        adminNoticeService.deleteNotice(postId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
