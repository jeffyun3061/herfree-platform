package com.herfree.domain.post.controller;

import com.herfree.domain.post.service.PostService;
import com.herfree.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 관리자 전용 게시글 관리 API — SecurityConfig에서 /api/admin/** 경로는 ROLE_ADMIN만 접근 가능하다
@RestController
@RequestMapping("/api/admin/posts")
@RequiredArgsConstructor
public class AdminPostController {

    private final PostService postService;

    @PatchMapping("/{postId}/hide")
    public ResponseEntity<ApiResponse<Void>> hidePost(@PathVariable Long postId) {
        postService.hidePost(postId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
