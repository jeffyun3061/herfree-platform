package com.herfree.domain.content.controller;

import com.herfree.domain.content.dto.response.ContentResponse;
import com.herfree.domain.content.service.ContentService;
import com.herfree.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 콘텐츠 조회 API — 비로그인 접근 허용
@RestController
@RequestMapping("/api/contents")
@RequiredArgsConstructor
public class ContentController {

    private final ContentService contentService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ContentResponse>>> getContents(
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(contentService.getContents(pageable)));
    }

    @GetMapping("/{contentId}")
    public ResponseEntity<ApiResponse<ContentResponse>> getContent(@PathVariable Long contentId) {
        return ResponseEntity.ok(ApiResponse.success(contentService.getContent(contentId)));
    }
}
