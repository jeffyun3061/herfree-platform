package com.herfree.domain.content.controller;

import com.herfree.domain.content.dto.request.ContentCreateRequest;
import com.herfree.domain.content.dto.request.ContentUpdateRequest;
import com.herfree.domain.content.dto.request.ContentVisibilityRequest;
import com.herfree.domain.content.dto.response.ContentResponse;
import com.herfree.domain.content.service.ContentService;
import com.herfree.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/contents")
@RequiredArgsConstructor
public class AdminContentController {

    private final ContentService contentService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ContentResponse>>> getContents(
            @PageableDefault(size = 50) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(contentService.getAdminContents(pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ContentResponse>> createContent(
            @AuthenticationPrincipal Long adminId,
            @Valid @RequestBody ContentCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(contentService.createContent(adminId, request)));
    }

    @PatchMapping("/{contentId}")
    public ResponseEntity<ApiResponse<ContentResponse>> updateContent(
            @PathVariable Long contentId,
            @Valid @RequestBody ContentUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(contentService.updateContent(contentId, request)));
    }

    @PatchMapping("/{contentId}/hide")
    public ResponseEntity<ApiResponse<Void>> hideContent(@PathVariable Long contentId) {
        contentService.hideContent(contentId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{contentId}/visibility")
    public ResponseEntity<ApiResponse<ContentResponse>> updateVisibility(
            @PathVariable Long contentId,
            @Valid @RequestBody ContentVisibilityRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(contentService.updateVisibility(contentId, request)));
    }
}
