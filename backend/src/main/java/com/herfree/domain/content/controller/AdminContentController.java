package com.herfree.domain.content.controller;

import com.herfree.domain.content.dto.request.ContentCreateRequest;
import com.herfree.domain.content.dto.request.ContentUpdateRequest;
import com.herfree.domain.content.dto.response.ContentResponse;
import com.herfree.domain.content.service.ContentService;
import com.herfree.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 콘텐츠 관리자 API — ROLE_ADMIN 권한 전용
@RestController
@RequestMapping("/api/admin/contents")
@RequiredArgsConstructor
public class AdminContentController {

    private final ContentService contentService;

    @PostMapping
    public ResponseEntity<ApiResponse<ContentResponse>> createContent(
            @AuthenticationPrincipal Long authorId,
            @Valid @RequestBody ContentCreateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(contentService.createContent(authorId, request)));
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
        return ResponseEntity.ok(ApiResponse.success("콘텐츠가 숨김 처리되었습니다.", null));
    }
}
