package com.herfree.domain.post.controller;

import com.herfree.domain.post.dto.response.AdminCommunityPostResponse;
import com.herfree.domain.post.dto.request.AdminPostUpdateRequest;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.service.PostService;
import com.herfree.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/posts")
@RequiredArgsConstructor
public class AdminPostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminCommunityPostResponse>>> getPosts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) PostStatus status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(postService.getAdminCommunityPosts(keyword, status, pageable)));
    }

    @PatchMapping("/{postId}/hide")
    public ResponseEntity<ApiResponse<Void>> hidePost(@PathVariable Long postId) {
        postService.hidePost(postId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> updatePost(
            @PathVariable Long postId,
            @Valid @RequestBody AdminPostUpdateRequest request
    ) {
        postService.adminUpdatePost(postId, request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{postId}/restore")
    public ResponseEntity<ApiResponse<Void>> restorePost(@PathVariable Long postId) {
        postService.restorePost(postId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
